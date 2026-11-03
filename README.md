# Air Place

[English](#english) | [日本語](#日本語)

---

## English

A behavior pack for Minecraft Bedrock Edition. It lets you place the block in your hand **in mid-air, at the end of your line of sight**. It runs on the Script API (`@minecraft/server`).

### Features

- If the end of your line of sight is in mid-air, the block you are holding is placed there. (Creative mode only)
- If there is a block in your line of sight, normal placement is performed
- **Blocks that need to be supported by another block are excluded**, such as levers, torches, buttons, signs, and flowers
- Air placement can be turned on and off with a command

### Controls

| Environment | Action |
|---|---|
| PC, consoles, etc. | In the air, operate the same way as normal block placement (e.g. right-click) |
| Phones and tablets (touch controls) | **Long-press** toward the air |

### Installation

1. Download `AirPlace.mcpack`
2. Open `AirPlace.mcpack` to import it into Minecraft
3. In each world's behavior pack settings, enable Air Place

### Commands

You can run these in a world with cheats enabled.

| Command | Action |
|---|---|
| `/scriptevent airplace:enable on` | Enable air placement |
| `/scriptevent airplace:enable off` | Disable air placement |
| `/scriptevent airplace:enable` | Toggle enabled/disabled |
| `/scriptevent airplace:status` | Show whether air placement is currently enabled |

The enabled/disabled state is saved to the world, so you do not need to set it again each time you re-enter the world.

### Configuration (config.js)

| Key | Default | Description |
|---|---|---|
| `placeDistance` | `4` | Distance in blocks at which the block is placed in the air |
| `normalReach` | `7` | If a block is within this range in your line of sight, normal placement takes over |
| `holdReleaseTicks` | `10` | [Touch only] Interval (ticks) after which a long press is considered finished. 20 ticks = 1 second |
| `breakProtectTicks` | `20` | [Touch only] Time (ticks) during which an air-placed block cannot be broken |
| `enabledPlacementDefault` | `true` | Initial state of air placement (a setting saved by the command takes priority) |
| `debug` | `true` | Turns debug output on or off. The developer switches it in `config.js` (not by command) |
| `commandNamespace` | `"airplace"` | Namespace for `/scriptevent` |
| `supportRequired.ids` | (list) | IDs of blocks that need support and cannot be placed in the air (exact match, without `minecraft:`) |
| `supportRequired.suffixes` | (list) | Same as above (suffix match, e.g. `_button`, `_sign`) |
| `facing.towardPlayerIds` | (list) | IDs of blocks whose front faces the player |
| `facing.flipHorizontalIds` | (list) | IDs of blocks whose facing is flipped horizontally (north/south/east/west) |
| `facing.flipVerticalIds` | (list) | IDs of blocks whose facing is flipped vertically (up/down) |

Blocks differ in how horizontal and vertical facing is handled, so pistons and observers have flip settings. If a block ends up facing the wrong way, add its ID to `flipHorizontalIds` or `flipVerticalIds`.

### Debug output

When `debug` in `config.js` is `true`, the progress of each step is printed to chat and the content log.

- To see the content log on screen, turn on "Enable Content Log GUI" under Creator in the in-game settings.
- If air placement does not seem to work, the line starting with `Aborted:` shows why it stopped.

---

## 日本語

Minecraft 統合版(Bedrock Edition)のビヘイビアパックです。手に持っているブロックを、**視線の先の空中**に設置できます。Script API(`@minecraft/server`)で動作します。

### 機能

- 視線の先が空中の場合は手に持つブロックを設置することができます。（クリエイティブモード限定）
- 視線の先にブロックがある場合は、通常の設置を行います
- レバー、トーチ、ボタン、看板、花など、**通常ブロックによる支えが必要なブロックは対象外**
- 空中設置機能の有効/無効をコマンドで切り替えることができます

### 操作方法

| 環境 | 操作 |
|---|---|
| PC・コンソールなど | 空中で通常のブロック設置と同じように操作する(右クリックなど) |
| スマホ・タブレット(タッチ操作) | 空中に向かって**長押し** |

### インストール

1. `AirPlace.mcpack`をダウンロードする
2. `AirPlace.mcpack`を開き、Minecraftへインポートする
3. 各ワールドのビヘイビアパックの設定から、Air Placeを有効にする

### コマンド

チートが有効なワールドで実行できます。

| コマンド | 動作 |
|---|---|
| `/scriptevent airplace:enable on` | 空中設置を有効にする |
| `/scriptevent airplace:enable off` | 空中設置を無効にする |
| `/scriptevent airplace:enable` | 有効/無効を切り替える |
| `/scriptevent airplace:status` | 現在の空中設置有効状態を表示する |

有効/無効の状態はワールドに保存されるため、ワールドに入りなおすごとに設定をする必要はありません。

### 設定(config.js)

| 項目 | 初期値 | 意味 |
|---|---|---|
| `placeDistance` | `4` | 空中に置く距離(ブロック数) |
| `normalReach` | `7` | この範囲内に視線の先のブロックがある場合は、通常の設置に任せる |
| `holdReleaseTicks` | `10` | [タッチ操作のみ] 長押しが終わったとみなす間隔(tick)。20tick = 1秒 |
| `breakProtectTicks` | `20` | [タッチ操作のみ] 空中設置したブロックを壊せなくする時間(tick) |
| `enabledPlacementDefault` | `true` | 空中設置の初期状態(コマンドで変えた設定が保存されていれば、そちらが優先) |
| `debug` | `true` | デバッグ出力のON/OFF。開発者が `config.js` で切り替える(コマンドでは切り替えない) |
| `commandNamespace` | `"airplace"` | `/scriptevent` のネームスペース |
| `supportRequired.ids` | (一覧) | 支えが必要で、空中に置けないブロックのID(完全一致、`minecraft:` なし) |
| `supportRequired.suffixes` | (一覧) | 同上(末尾一致。例: `_button`、`_sign`) |
| `facing.towardPlayerIds` | (一覧) | 前面がプレイヤー側を向くブロックのID |
| `facing.flipHorizontalIds` | (一覧) | 水平方向(東西南北)で、向きを反転させるブロックのID |
| `facing.flipVerticalIds` | (一覧) | 垂直方向(上下)で、向きを反転させるブロックのID |

ブロックによって、水平・垂直で向きの扱いが違うため、ピストンとオブザーバーは反転の設定を入れています。向きが逆になるブロックがあれば、`flipHorizontalIds` と `flipVerticalIds` にIDを追加してください。

### デバッグ出力

`config.js` の `debug` を `true` にすると、処理の途中経過がチャットとコンテンツログに出力されます。

- コンテンツログは、ゲーム内の設定の「クリエイター」で「コンテンツログ GUI を有効にする」をオンにすると、画面で確認できます。
- 「空中設置が動かない」と感じた時は、`Aborted:` で始まる行が、止まった理由を示します。
