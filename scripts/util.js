import { config } from "./config.js";

// バニラのブロック・アイテムIDの先頭につく文字列
export const NAMESPACE_PREFIX = "minecraft:";

// デバッグ出力関数
export function debug(player, message) {
    // デバッグ無効時は終了させる　
    if (!config.debug) {
        return;
    }

    // メッセージを送信する
    const text = `[AirPlace] ${message}`;
    console.log(text);
    if (player) {
        player.sendMessage(text);
    }
}

// 座標出力関数
export function formatVector(v) {
    // (x, y, z)形式の文字列にする(小数第2位まで)
    return `(${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)})`;
}

// ID抽出関数
export function stripNamespace(typeId) {
    if (typeId.startsWith(NAMESPACE_PREFIX)) {
        // 例: "minecraft:piston" -> "piston"
        return typeId.slice(NAMESPACE_PREFIX.length);
    }
    else {
        return typeId;
    }
}

// 小数座標 location が、ブロック座標 target と同じブロックに含まれるか
export function isInsideBlock(location, target) {
    return (
        Math.floor(location.x) === target.x &&
        Math.floor(location.y) === target.y &&
        Math.floor(location.z) === target.z
    );
}

// 視線に最も近い6方向("up" / "down" / "north" / "south" / "east" / "west")を返す
export function getNearestLookingDirection(dir) {
    const ax = Math.abs(dir.x);
    const ay = Math.abs(dir.y);
    const az = Math.abs(dir.z);

    // 上下方向の成分が最も大きい場合
    if (ay >= ax && ay >= az) {
        if (dir.y > 0) {
            return "up";
        }
        return "down";
    }

    // 東西方向の成分が最も大きい場合
    if (ax >= az) {
        if (dir.x > 0) {
            return "east";
        }
        return "west";
    }

    // 南北方向の成分が最も大きい場合
    if (dir.z > 0) {
        return "south";
    }
    return "north";
}

// 視線に最も近い水平4方向("north" / "south" / "east" / "west")を返す
export function getNearestHorizontalDirection(dir) {
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
