// コマンド処理: /scriptevent <ネームスペース>:<コマンド名> [引数]
import { config } from "./config.js";
import { isEnabledPlacement, savePlacementState } from "./state.js";

// 引数[ON|OFF]の確認関数
function parseSwitch(message, current) {
    // 引数を取得
    const arg = message.trim().toLowerCase();

    if (arg === "on") {
        // 引数が「ON」の場合はtrueを返す
        return true;
    }
    else if (arg === "off") {
        // 引数が「OFF」の場合はtrueを返す
        return false;
    }
    else if (arg === "") {
        // 引数がない場合は現在の状態を反転した値を返す
        return !current;
    }
    else {
        return undefined;
    }
}

// true / false を "ON" / "OFF" の文字列にする
function stateText(value) {
    let text;
    if (value) {
        text = "ON";
    }
    else {
        text = "OFF";
    }
    return text;
}

// コマンドを実行したプレイヤーにメッセージを返す(コンテンツログにも出力)
function reply(player, text) {
    console.log(text);
    if (player) {
        player.sendMessage(text);
    }
}

// /scriptevent {commandNamespace}:enable [on|off] コマンド実行処理
// 空中設置の有効/無効を切り替える
function toggleEnabled(event) {
    // 引数を確認する
    const nextState = parseSwitch(event.message, isEnabledPlacement());
    if (nextState !== undefined) {
        // 状態を保存する
        savePlacementState(nextState);
        // 状態を表示する
        showPlacementStateMessage(event);
    }
    else {
        // 引数が仕様通りでない場合
        showCommandNotFoundMessage(event);
    }
}

// /scriptevent {commandNamespace}:status コマンド実行処理
// 現在のブロック設置有効状態を表示する
function showPlacementStateMessage(event) {
    // 空中設置状態を出力する
    reply(event.sourceEntity, `Air placement: ${stateText(isEnabledPlacement())}`);
}

// コマンド不明時出力関数
function showCommandNotFoundMessage(event) {
    reply(event.sourceEntity, `Command not found: ${config.commandNamespace}:enable ${event.message.trim()} (usage: enable [on|off])`);
}

// /scripteventコマンドを受け取った時の処理
export function onScriptEvent(event) {
    // NameSpaceを確認
    const prefix = `${config.commandNamespace}:`;
    if (!event.id.startsWith(prefix)) {
        return;
    }

    // コマンド名から処理を探して実行する
    const command = event.id.slice(prefix.length);
    switch (command) {
        case "enable":
            toggleEnabled(event);
            break;
        case "status":
            showPlacementStateMessage(event);
            break;
        default:
            showCommandNotFoundMessage(event);
            break;
    }
}
