// ブロック設置処理: アイテムを使った時に、視線の先の空中へブロックを置く
import { BlockPermutation, BlockTypes, GameMode } from "@minecraft/server";
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

// config.json の配列を、判定しやすいように Set にしておく
const towardPlayerIds = new Set(config.facing.towardPlayerIds);
const flipHorizontalIds = new Set(config.facing.flipHorizontalIds);
const flipVerticalIds = new Set(config.facing.flipVerticalIds);

// 支えが必要なブロックかを判別する関数
function needsSupport(typeId) {
    // カスタムブロック(minecraft: 以外)は判定せず支え必要なしの判定とする
    if (!typeId.startsWith(NAMESPACE_PREFIX)) {
        return false;
    }

    // IDがsupportRequired.idsのいずれかと完全一致する場合は支え必要の判定とする
    const supportRequiredIds = new Set(config.supportRequired.ids);
    const id = stripNamespace(typeId);
    if (supportRequiredIds.has(id)) {
        return true;
    }

    // IDの末尾がIDがsupportRequired.suffixesのいずれかと一致する場合は支え必要の判定とする
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

    debug(player, `初期ステート: ${JSON.stringify(permutation.getAllStates())}`);

    try {
        permutation = applyFacingDirection(player, permutation, id, dir);
        permutation = applyCardinalDirection(player, permutation, dir);
        permutation = applyWeirdoDirection(player, permutation, dir);
    } catch (e) {
        debug(player, `向き反映に失敗: ${e}`);
    }

    debug(player, `最終ステート: ${JSON.stringify(permutation.getAllStates())}`);
    return permutation;
}

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

// アイテム使用イベント発火時処理
export function onItemUse(event) {
    const player = event.source;
    const item = event.itemStack;

    // 無効時は何もしない
    if (!isEnabledPlacement()) {
        debug(player, "中断: 空中設置無効状態");
        return;
    }

    debug(player, "----------------------------------------");
    debug(player, `onItemUse発火: item=${item.typeId}`);

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

    const { target } = place;
    debug(player, `設置後の実ステート: ${JSON.stringify(place.block.permutation.getAllStates())}`);
    debug(player, `設置成功: ${item.typeId} -> (${target.x}, ${target.y}, ${target.z})`);
}
