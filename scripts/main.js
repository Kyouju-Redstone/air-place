import { world, BlockPermutation, BlockTypes, GameMode } from "@minecraft/server";

// ===== 設定 =====

// 空中に置く距離(ブロック数)
const PLACE_DISTANCE = 4;
// 通常の設置が効く範囲。この範囲内にブロックが見えている時は通常設置に任せる
const NORMAL_REACH = 7;
// デバッグ出力のON/OFF
const DEBUG = true;

// ===== 支えが必要なブロック(空中設置の対象外) =====

// 完全一致。"minecraft:" を除いたIDで書く
const SUPPORT_REQUIRED_IDS = new Set([
    "lever",
    "torch",
    "soul_torch",
    "redstone_torch",
    "copper_torch",
    "underwater_torch",
    "lantern",
    "soul_lantern",
    "ladder",
    "vine",
    "glow_lichen",
    "sculk_vein",
    "tripwire_hook",
    "rail",
    "golden_rail",
    "detector_rail",
    "activator_rail",
    "snow_layer",
    "fire",
    "soul_fire",
    "item_frame",
    "glow_frame",
    "short_grass",
    "tallgrass",
    "fern",
    "large_fern",
    "deadbush",
    "brown_mushroom",
    "red_mushroom",
    "crimson_fungus",
    "warped_fungus",
    "crimson_roots",
    "warped_roots",
    "nether_sprouts",
    "hanging_roots",
    "dandelion",
    "poppy",
    "blue_orchid",
    "allium",
    "azure_bluet",
    "oxeye_daisy",
    "cornflower",
    "lily_of_the_valley",
    "wither_rose",
    "torchflower",
    "pitcher_plant",
    "open_eyeblossom",
    "closed_eyeblossom",
    "sunflower",
    "lilac",
    "rose_bush",
    "peony",
    "cactus",
    "bamboo",
    "waterlily",
    "sea_pickle",
    "kelp",
    "seagrass",
    "cocoa",
    "chorus_flower",
    "chorus_plant",
    "pointed_dripstone",
    "small_amethyst_bud",
    "medium_amethyst_bud",
    "large_amethyst_bud",
    "amethyst_cluster",
    "leaf_litter",
    "wildflowers",
    "pink_petals",
    "firefly_bush",
    "bush",
    "cactus_flower",
]);

// 末尾一致
const SUPPORT_REQUIRED_SUFFIXES = [
    "_button",
    "_pressure_plate",
    "_sign",
    "_hanging_sign",
    "_carpet",
    "_sapling",
    "_tulip",
    "_candle",
    "_banner",
    "_coral_fan",
    "_coral_wall_fan",
    "_coral",
    "_torch",
    "_lantern",
    "_propagule",
];

// ===== 向きの設定 =====

// facing_direction を使い、前面がプレイヤー側を向くブロック
const FACING_TOWARD_PLAYER_IDS = new Set([
    "piston",
    "sticky_piston",
    "observer",
    "dropper",
    "dispenser",
    "barrel",
    "command_block",
    "repeating_command_block",
    "chain_command_block",
]);

// 前面がプレイヤーと逆(視線と同じ方向)を向かせたいブロックのID
// ピストンの向きが逆だった場合は "piston", "sticky_piston" をここに入れる
const FACING_AWAY_FROM_PLAYER_IDS = new Set([]);

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

// 水平方向(東西南北)で、前面の向きを反転させるブロックのID
const FLIP_HORIZONTAL_IDS = new Set([
    "piston",
    "sticky_piston",
    "observer",
]);

// 垂直方向(上下)で、前面の向きを反転させるブロックのID
// 上下も逆だった場合は、ここにIDを足す
const FLIP_VERTICAL_IDS = new Set([
    "observer",
]);

// ===== ユーティリティ =====

function debug(player, message) {
    if (!DEBUG) {
        return;
    }
    const text = `[AirPlace] ${message}`;
    console.warn(text);
    if (player) {
        player.sendMessage(text);
    }
}

function fmt(v) {
    return `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`;
}

function needsSupport(typeId) {
    // カスタムブロック(minecraft: 以外)は判定せず許可する
    if (!typeId.startsWith("minecraft:")) {
        return false;
    }
    const id = typeId.slice("minecraft:".length);
    if (SUPPORT_REQUIRED_IDS.has(id)) {
        return true;
    }
    for (const suffix of SUPPORT_REQUIRED_SUFFIXES) {
        if (id.endsWith(suffix)) {
            return true;
        }
    }
    return false;
}

// 視線に最も近い6方向を返す
function getNearestLookingDirection(dir) {
    const ax = Math.abs(dir.x);
    const ay = Math.abs(dir.y);
    const az = Math.abs(dir.z);
    if (ay >= ax && ay >= az) {
        if (dir.y > 0) {
            return "up";
        }
        return "down";
    }
    if (ax >= az) {
        if (dir.x > 0) {
            return "east";
        }
        return "west";
    }
    if (dir.z > 0) {
        return "south";
    }
    return "north";
}

// 視線に最も近い水平4方向を返す
function getNearestHorizontalDirection(dir) {
    if (Math.abs(dir.x) >= Math.abs(dir.z)) {
        if (dir.x > 0) {
            return "east";
        }
        return "west";
    }
    if (dir.z > 0) {
        return "south";
    }
    return "north";
}

// "minecraft:" 付きと無しの両方を試して、存在するステート名を返す
function findStateKey(permutation, baseName) {
    const candidates = [`minecraft:${baseName}`, baseName];
    for (const key of candidates) {
        if (permutation.getState(key) !== undefined) {
            return key;
        }
    }
    return undefined;
}

// 数値と文字列、両方のfacing_directionに向きを反映する
function setFacing(permutation, facing) {
    const namespacedKey = "minecraft:facing_direction";
    const legacyKey = "facing_direction";

    // 文字列ステート("down" など)
    if (permutation.getState(namespacedKey) !== undefined) {
        permutation = permutation.withState(namespacedKey, facing);
    }

    // 数値ステート(0〜5)
    if (permutation.getState(legacyKey) !== undefined) {
        permutation = permutation.withState(legacyKey, FACING_VALUE[facing]);
    }

    return permutation;
}

// 向きを反映したブロックパーミュテーションを作る
function createPermutation(player, typeId, dir) {
    let permutation = BlockPermutation.resolve(typeId);
    const id = typeId.replace("minecraft:", "");

    debug(player, `初期ステート: ${JSON.stringify(permutation.getAllStates())}`);

    try {
        // ピストン・オブザーバー・ディスペンサーなど(前面がプレイヤー側)
        if (FACING_TOWARD_PLAYER_IDS.has(id)) {
            const look = getNearestLookingDirection(dir);
            const isVertical = look === "up" || look === "down";
            let facing = OPPOSITE[look];

            if (isVertical) {
                if (FLIP_VERTICAL_IDS.has(id)) {
                    facing = look;
                }
            } else {
                if (FLIP_HORIZONTAL_IDS.has(id)) {
                    facing = look;
                }
            }

            permutation = setFacing(permutation, facing);
            debug(player, `向き反映: look=${look} → facing=${facing}`);
        }

        // かまど・チェスト・カボチャなど(前面がプレイヤー側)
        const cardinalKey = findStateKey(permutation, "cardinal_direction");
        if (cardinalKey !== undefined) {
            const facing = OPPOSITE[getNearestHorizontalDirection(dir)];
            permutation = permutation.withState(cardinalKey, facing);
            debug(player, `向き反映: ${cardinalKey}=${facing}`);
        }

        // 階段(上り方向がプレイヤーの視線方向)
        const weirdoKey = findStateKey(permutation, "weirdo_direction");
        if (weirdoKey !== undefined) {
            const look = getNearestHorizontalDirection(dir);
            permutation = permutation.withState(weirdoKey, WEIRDO_VALUE[look]);
            debug(player, `向き反映: ${weirdoKey}=${look}`);
        }
    } catch (e) {
        debug(player, `向き反映に失敗: ${e}`);
    }

    debug(player, `最終ステート: ${JSON.stringify(permutation.getAllStates())}`);
    return permutation;
}

// ===== メイン処理 =====

world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;
    const item = event.itemStack;

    debug(player, `----------------------------------------`);
    debug(player, `itemUse発火: item=${item.typeId}`);

    // クリエイティブモード以外の場合は中断
    if (player.getGameMode() !== GameMode.Creative) {
        debug(player, "中断: 現在クリエイティブモードではありません");
        return;
    }

    // ブロック以外のアイテムである場合は中断
    const blockType = BlockTypes.get(item.typeId);
    if (!blockType) {
        debug(player, `中断: ${item.typeId} はブロックではありません`);
        return;
    }

    // 支えが必要なブロックは対象外とする
    if (needsSupport(item.typeId)) {
        debug(player, `中断: ${item.typeId} は支えが必要なブロックです`);
        return;
    }

    // カーソルの先にブロックがあるなら通常の設置に任せる
    const hit = player.getBlockFromViewDirection({ maxDistance: NORMAL_REACH });
    if (hit) {
        debug(player, `中断: 視線の先にブロックがあるため通常設置を行う`);
        return;
    }

    // 視線の先の座標を計算
    const head = player.getHeadLocation();
    const dir = player.getViewDirection();
    debug(player, `head=${fmt(head)} dir=${fmt(dir)}`);

    const target = {
        x: Math.floor(head.x + dir.x * PLACE_DISTANCE),
        y: Math.floor(head.y + dir.y * PLACE_DISTANCE),
        z: Math.floor(head.z + dir.z * PLACE_DISTANCE),
    };

    const block = player.dimension.getBlock(target);
    if (!block) {
        debug(player, "中断: 設置先のブロックを取得できません(未ロードチャンクの可能性)");
        return;
    }

    // 空気か液体の場所にだけ置く
    if (!block.isAir && !block.isLiquid) {
        debug(player, `中断: 設置先が置換不可 (${block.typeId})`);
        return;
    }

    // 自分の足元・頭の位置には置かない
    const feet = player.dimension.getBlock(player.location);
    const headBlock = player.dimension.getBlock(head);
    const isSame = (a, b) => {
        return a && a.x === b.x && a.y === b.y && a.z === b.z;
    };
    if (isSame(feet, target) || isSame(headBlock, target)) {
        debug(player, "中断: 設置先がプレイヤー自身の位置と重なる");
        return;
    }

    // 向きを反映して設置
    const permutation = createPermutation(player, item.typeId, dir);
    block.setPermutation(permutation);
    debug(player, `設置後の実ステート: ${JSON.stringify(block.permutation.getAllStates())}`);
    debug(player, `設置成功: ${item.typeId} → (${target.x}, ${target.y}, ${target.z})`);
});
