// 調整できる設定。値を書き換えるだけで挙動を変えられる
export const config = {
    // 空中に置く距離(ブロック数)
    placeDistance: 4,

    // 通常の設置が効く範囲。この範囲内にブロックが見えている時は通常設置に任せる
    normalReach: 7,

    // 空中設置の初期状態(コマンドで変えた設定が保存されていれば、そちらが優先される)
    enabledPlacementDefault: true,

    // デバッグ出力のON/OFF(開発者がここで切り替える)
    debug: true,

    // /scriptevent のネームスペース(/scriptevent air_place:xxx)
    commandNamespace: "airplace",

    // 支えが必要で、空中に置けないブロック("minecraft:" を除いたID)
    supportRequired: {
        // 完全一致
        ids: [
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
        ],
        // 末尾一致
        suffixes: [
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
        ],
    },

    // ブロックの向きの設定
    facing: {
        // 前面がプレイヤー側を向くブロック(facing_direction を使うもの)
        towardPlayerIds: [
            "piston",
            "sticky_piston",
            "observer",
            "dropper",
            "dispenser",
            "barrel",
            "command_block",
            "repeating_command_block",
            "chain_command_block",
        ],
        // 水平方向(東西南北)で、前面の向きを反転させるブロック
        flipHorizontalIds: [
            "piston",
            "sticky_piston",
            "observer",
        ],
        // 垂直方向(上下)で、前面の向きを反転させるブロック
        flipVerticalIds: [
            "observer",
        ],
    },
};
