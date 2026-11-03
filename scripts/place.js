// ブロック設置処理: アイテムを使った時に、視線の先の空中へブロックを置く
import {
    system,
    BlockPermutation,
    BlockTypes,
    GameMode,
    InputMode,
} from "@minecraft/server";
import { config } from "./config.js";
import {
    NAMESPACE_PREFIX,
    debug,
    stripNamespace,
    isInsideBlock,
    getNearestLookingDirection,
    getNearestHorizontalDirection,
} from "./util.js";
import { isEnabledPlacement } from "./state.js";

// ===== 定数 =====

// 方向の反対
const OPPOSITE = {
    up: "down",
    down: "up",
    north: "south",
    south: "north",
    east: "west",
    west: "east",
};

// facing_direction(数値ステート)の値
const FACING_VALUE = {
    down: 0,
    up: 1,
    north: 2,
    south: 3,
    west: 4,
    east: 5,
};

// weirdo_direction(階段)の値
const WEIRDO_VALUE = {
    east: 0,
    west: 1,
    south: 2,
    north: 3,
};

// config.js の配列を、判定しやすいように Set にしておく
const supportRequiredIds = new Set(config.supportRequired.ids);
const towardPlayerIds = new Set(config.facing.towardPlayerIds);
const flipHorizontalIds = new Set(config.facing.flipHorizontalIds);
const flipVerticalIds = new Set(config.facing.flipVerticalIds);

// ===== 状態 =====

// プレイヤーごとの、最後に操作(アイテム使用・ブロックを叩く・ブロックを壊す)したtick
// スマホで、長押しが継続中かどうかの判定に使う
const lastActivityTicks = new Map();

// 空中設置したブロックの座標 → 破壊保護が切れるtick
const protectedBlocks = new Map();

// ===== 共通の判定 =====

// タッチ操作中かどうか
function isTouchInput(player) {
    return player.inputInfo.lastInputModeUsed === InputMode.Touch;
}

// 座標をMapのキーにするための文字列にする
function makeBlockKey(dimensionId, location) {
    return `${dimensionId}:${location.x},${location.y},${location.z}`;
}

// 支えが必要なブロックかを判別する関数
function needsSupport(typeId) {
    // カスタムブロック(minecraft: 以外)は判定せず支え必要なしの判定とする
    if (!typeId.startsWith(NAMESPACE_PREFIX)) {
        return false;
    }

    // IDがsupportRequired.idsのいずれかと完全一致する場合は支え必要の判定とする
    const id = stripNamespace(typeId);
    if (supportRequiredIds.has(id)) {
        return true;
    }

    // IDの末尾がsupportRequired.suffixesのいずれかと一致する場合は支え必要の判定とする
    for (const suffix of config.supportRequired.suffixes) {
        if (id.endsWith(suffix)) {
            return true;
        }
    }

    return false;
}

// 空中にブロックが設置可能かを返却する関数
function isPlaceableBlock(player, item) {
    // クリエイティブモード以外の場合は設置不可
    if (player.getGameMode() !== GameMode.Creative) {
        debug(player, "中断: 現在クリエイティブモードではありません");
        return false;
    }

    // ブロック以外のアイテムは対象外
    if (!BlockTypes.get(item.typeId)) {
        debug(player, `中断: ${item.typeId} はブロックではありません`);
        return false;
    }

    // 支えが必要なブロックは対象外
    if (needsSupport(item.typeId)) {
        debug(player, `中断: ${item.typeId} は支えが必要なブロックです`);
        return false;
    }

    return true;
}

// ===== 向きの反映 =====

// ステート名を探す("minecraft:" 付きと無しの両方を試す)
function findStateKey(permutation, baseName) {
    const candidates = [`minecraft:${baseName}`, baseName];
    for (const key of candidates) {
        if (permutation.getState(key) !== undefined) {
            return key;
        }
    }
    return undefined;
}

// facing_direction に向きを反映する
// 数値ステート(0〜5)と文字列ステート("down" など)の両方がある場合に備えて、両方に書き込む
function setFacing(permutation, facing) {
    const namespacedKey = "minecraft:facing_direction";
    const legacyKey = "facing_direction";

    // 文字列ステート
    if (permutation.getState(namespacedKey) !== undefined) {
        permutation = permutation.withState(namespacedKey, facing);
    }

    // 数値ステート
    if (permutation.getState(legacyKey) !== undefined) {
        permutation = permutation.withState(legacyKey, FACING_VALUE[facing]);
    }

    return permutation;
}

// ピストン・オブザーバー・ディスペンサーなど(前面がプレイヤー側を向くブロック)
function applyFacingDirection(player, permutation, id, dir) {
    if (!towardPlayerIds.has(id)) {
        return permutation;
    }

    const look = getNearestLookingDirection(dir);
    const isVertical = look === "up" || look === "down";

    // 基本は、視線と逆(前面がプレイヤー側)
    let facing = OPPOSITE[look];

    // ブロックによって水平・垂直で向きが逆になるため、必要なものだけ視線と同じ向きに直す
    if (isVertical) {
        if (flipVerticalIds.has(id)) {
            facing = look;
        }
    } else {
        if (flipHorizontalIds.has(id)) {
            facing = look;
        }
    }

    debug(player, `向き反映: look=${look} -> facing=${facing}`);
    return setFacing(permutation, facing);
}

// かまど・チェスト・カボチャなど(水平4方向で、前面がプレイヤー側を向くブロック)
function applyCardinalDirection(player, permutation, dir) {
    const key = findStateKey(permutation, "cardinal_direction");
    if (key === undefined) {
        return permutation;
    }

    const facing = OPPOSITE[getNearestHorizontalDirection(dir)];
    debug(player, `向き反映: ${key}=${facing}`);
    return permutation.withState(key, facing);
}

// 階段(上り方向がプレイヤーの視線方向になる)
function applyWeirdoDirection(player, permutation, dir) {
    const key = findStateKey(permutation, "weirdo_direction");
    if (key === undefined) {
        return permutation;
    }

    const look = getNearestHorizontalDirection(dir);
    debug(player, `向き反映: ${key}=${look}`);
    return permutation.withState(key, WEIRDO_VALUE[look]);
}

// 向きを反映したブロックパーミュテーションを作る
function createPermutation(player, typeId, dir) {
    let permutation = BlockPermutation.resolve(typeId);
    const id = stripNamespace(typeId);

    debug(player, () => `初期ステート: ${JSON.stringify(permutation.getAllStates())}`);

    try {
        permutation = applyFacingDirection(player, permutation, id, dir);
        permutation = applyCardinalDirection(player, permutation, dir);
        permutation = applyWeirdoDirection(player, permutation, dir);
    } catch (e) {
        debug(player, `向き反映に失敗: ${e}`);
    }

    debug(player, () => `最終ステート: ${JSON.stringify(permutation.getAllStates())}`);
    return permutation;
}

// ===== 設置先の決定 =====

// 設置予定座標の情報を取得する関数
function findPlaceTarget(player) {
    // カーソルの先にブロックがある場合は通常の設置を行う
    const hit = player.getBlockFromViewDirection({ maxDistance: config.normalReach });
    if (hit) {
        debug(player, "中断: 視線の先にブロックがあるため通常設置を行う");
        return undefined;
    }

    // 視線の先の{placeDistance}ブロック離れた座標を計算する
    const head = player.getHeadLocation();
    const dir = player.getViewDirection();
    const target = {
        x: Math.floor(head.x + dir.x * config.placeDistance),
        y: Math.floor(head.y + dir.y * config.placeDistance),
        z: Math.floor(head.z + dir.z * config.placeDistance),
    };

    // 設置予定座標のブロックを確認
    const block = player.dimension.getBlock(target);
    if (!block) {
        debug(player, "中断: 設置先のブロックを取得できません(未ロードチャンクの可能性)");
        return undefined;
    }

    // 設置予定座標のブロックが空気か液体の場所にだけブロックを設置する
    if (!block.isAir && !block.isLiquid) {
        debug(player, `中断: 設置先が置換不可 (${block.typeId})`);
        return undefined;
    }

    // 自分の足元・頭の位置には設置しない
    if (isInsideBlock(player.location, target) || isInsideBlock(head, target)) {
        debug(player, "中断: 設置先がプレイヤー自身の位置と重なる");
        return undefined;
    }

    return { block, target, dir };
}

// ===== スマホの長押し対策 =====

// 操作があったことを記録する
function recordActivity(player) {
    lastActivityTicks.set(player.id, system.currentTick);
}

// 長押しが継続中かどうかを返す(タッチ操作のみ)
// 判定のたびに「最後に操作したtick」を更新するので、押し続けている間は継続中のままになる
function isHoldContinuing(player) {
    const now = system.currentTick;
    const lastTick = lastActivityTicks.get(player.id);
    lastActivityTicks.set(player.id, now);

    if (lastTick === undefined) {
        return false;
    }

    const gap = now - lastTick;
    debug(player, `前回の操作から ${gap}tick`);
    return gap <= config.holdReleaseTicks;
}

// 保護期限が切れたブロックを記録から消す
function cleanupProtectedBlocks() {
    const now = system.currentTick;
    for (const [key, expireTick] of protectedBlocks) {
        if (expireTick <= now) {
            protectedBlocks.delete(key);
        }
    }
}

// 空中設置したブロックを、一定時間だけ壊せなくする(タッチ操作のみ)
function protectPlacedBlock(player, target) {
    if (!isTouchInput(player)) {
        return;
    }

    cleanupProtectedBlocks();
    const key = makeBlockKey(player.dimension.id, target);
    protectedBlocks.set(key, system.currentTick + config.breakProtectTicks);
}

// ===== 空中設置 =====

// 空中設置を試みる
function tryAirPlace(player, item) {
    debug(player, "----------------------------------------");
    debug(player, `空中設置を試行: item=${item.typeId}`);

    // ブロックの設置が可能かを判別
    if (!isPlaceableBlock(player, item)) {
        return;
    }

    // 設置予定座標の情報を取得
    const place = findPlaceTarget(player);
    if (!place) {
        return;
    }

    // 設置するブロックの向きを反映して設置
    const permutation = createPermutation(player, item.typeId, place.dir);
    place.block.setPermutation(permutation);

    // 設置したブロックを、一定時間だけ壊せなくする
    protectPlacedBlock(player, place.target);

    const { target } = place;
    debug(player, () => `設置後の実ステート: ${JSON.stringify(place.block.permutation.getAllStates())}`);
    debug(player, `設置成功: ${item.typeId} -> (${target.x}, ${target.y}, ${target.z})`);
}

// ===== イベント処理 =====

// アイテム使用イベント発火時処理
// PCは右クリック、スマホは長押しで発火する
export function onItemUse(event) {
    const player = event.source;
    debug(player, () => `itemUse発火: tick=${system.currentTick}`);

    // 無効時は何もしない
    if (!isEnabledPlacement()) {
        debug(player, "中断: 空中設置無効状態");
        return;
    }

    // スマホでは、長押しが続いている間は設置しない
    // (指で触れた位置がわからないため、ブロックを壊した後も続く長押しで、設置が走るのを防ぐ)
    if (isTouchInput(player) && isHoldContinuing(player)) {
        debug(player, "中断: 長押し継続中のため設置しない");
        return;
    }

    tryAirPlace(player, event.itemStack);
}

// ブロックを叩いた時のイベント発火時処理(スマホのみ)
// ブロックに対する長押しとみなして、操作があったことを記録する
export function onEntityHitBlock(event) {
    const player = event.damagingEntity;
    if (player.typeId !== "minecraft:player") {
        return;
    }
    if (!isTouchInput(player)) {
        return;
    }

    recordActivity(player);
    debug(player, () => `ブロックを叩いた: tick=${system.currentTick}`);
}

// ブロック破壊イベント発火時処理
// 空中設置した直後のブロックは、保護期間中は壊せないようにする
export function onPlayerBreakBlock(event) {
    // スマホでは、ブロックを壊した操作も、操作があったこととして記録する
    const player = event.player;
    if (isTouchInput(player)) {
        recordActivity(player);
    }

    const key = makeBlockKey(event.block.dimension.id, event.block.location);
    const expireTick = protectedBlocks.get(key);
    if (expireTick === undefined) {
        return;
    }

    // 保護期間が過ぎていれば、通常通り壊せる
    if (expireTick <= system.currentTick) {
        protectedBlocks.delete(key);
        return;
    }

    // 保護期間中は破壊をキャンセルする
    event.cancel = true;

    // beforeイベント内ではチャット送信などができないため、デバッグ出力は次のtickに回す
    system.run(() => {
        debug(player, "破壊をキャンセル: 空中設置直後のブロックは保護中");
    });
}
