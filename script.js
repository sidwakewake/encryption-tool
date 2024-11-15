const compressionIterations = 3; // 压缩次数

// 生成加密密钥（确保一致性）
function generateEncryptionKey(password) {
    if (password) {
        return CryptoJS.enc.Utf8.parse(CryptoJS.MD5(password).toString().slice(0, 16));
    } else {
        const randomKey = Array(16)
            .fill(0)
            .map(() => String.fromCharCode(Math.floor(Math.random() * 256)))
            .join('');
        alert(`未提供密码，已生成临时密钥：${randomKey}`);
        return CryptoJS.enc.Utf8.parse(randomKey);
    }
}

// 压缩文本
function compressText(text, iterations) {
    let data = new TextEncoder().encode(text);
    for (let i = 0; i < iterations; i++) {
        data = pako.deflate(data);
    }
    return btoa(String.fromCharCode(...data)); // 转为 Base64
}

// 解压文本
function decompressText(base64Text, iterations) {
    let data = Uint8Array.from(atob(base64Text), c => c.charCodeAt(0));
    for (let i = 0; i < iterations; i++) {
        data = pako.inflate(data);
    }
    return new TextDecoder().decode(data);
}

// 加密文本
function encryptText() {
    const text = document.getElementById("inputText").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!text) {
        alert("请输入要加密的文本！");
        return;
    }

    try {
        const compressedText = compressText(text, compressionIterations);
        const key = generateEncryptionKey(password);

        // 生成加密包（包含元信息）
        const payload = {
            iterations: compressionIterations,
            data: compressedText
        };
        const payloadString = JSON.stringify(payload);

        const encrypted = CryptoJS.AES.encrypt(payloadString, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }).toString();

        document.getElementById("resultText").value = encrypted;
        autoResizeTextArea("resultText");
    } catch (error) {
        alert("加密失败！");
        console.error("Error during encryption:", error);
    }
}

// 解密文本
function decryptText() {
    const encryptedText = document.getElementById("inputText").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!encryptedText) {
        alert("请输入要解密的文本！");
        return;
    }

    try {
        const key = generateEncryptionKey(password);
        const decrypted = CryptoJS.AES.decrypt(encryptedText, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }).toString(CryptoJS.enc.Utf8);

        // 解析加密包
        const payload = JSON.parse(decrypted);
        const decompressedText = decompressText(payload.data, payload.iterations);

        document.getElementById("resultText").value = decompressedText;
        autoResizeTextArea("resultText");
    } catch (error) {
        alert("解密失败或密码错误！");
        console.error("Error during decryption:", error);
    }
}

// 自动调整文本框大小
function autoResizeTextArea(elementId) {
    const textarea = document.getElementById(elementId);
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
}

// 生成随机密码
function generatePassword() {
    const password = Array(12)
        .fill(0)
        .map(() =>
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(
                Math.floor(Math.random() * 62)
            )
        )
        .join('');
    document.getElementById("password").value = password;
}
