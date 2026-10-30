# Config document
**[English]**

Description of the settings available in `config.json`.

## Configuration Options

| Item | Description |
| ---------------------------------------------- | --------------------------------------------- |
| `placeDistance` | Maximum distance for placing blocks in mid-air (in blocks) |
| `normalReach` | If a block is within this range, normal block placement is used instead. |
| `enabledDefault` | Default state of mid-air placement (saved settings changed via commands take priority) |
| `debug` | Enable/disable debug output (not configurable via commands) |
| `commandNamespace` | Namespace for `/scriptevent` |
| `supportRequired.ids` / `suffixes` | Blocks that require support and are excluded (exact match / suffix match, without the `minecraft:` prefix) |
| `facing.towardPlayerIds` | Blocks whose front faces point toward the player |
| `facing.flipHorizontalIds` / `flipVerticalIds` | Blocks whose facing direction is flipped horizontally / vertically |

---

**[日本語]**

`config.json` で設定できる項目について説明します。

## 設定項目

| 項目 | 意味 |
| ---------------------------------------------- | --------------------------------------------- |
| `placeDistance` | 空中設置可能な最大距離（ブロック数） |
| `normalReach` | この範囲内に設置可能なブロックがある場合は、通常の設置処理に任せる |
| `enabledDefault` | 空中設置の初期状態（コマンドで変更した設定が保存されている場合は、そちらが優先） |
| `debug` | デバッグ出力のON/OFF（コマンドでは切り替え不可） |
| `commandNamespace` | `/scriptevent` のネームスペース |
| `supportRequired.ids` / `suffixes` | 支えが必要なため対象外にするブロック（完全一致 / 末尾一致、`minecraft:` なし） |
| `facing.towardPlayerIds` | 前面がプレイヤーの方向を向くブロック |
| `facing.flipHorizontalIds` / `flipVerticalIds` | 水平 / 垂直方向に向きを反転させるブロック |
