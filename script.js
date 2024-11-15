// 固定密钥（未提供密码时使用）
const defaultKey = CryptoJS.enc.Utf8.parse("DefaultFixedKey12345");

// 生成随机密码
function generatePassword() {
    const password = Array(12).fill(0).map(() =>
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".charAt(
            Math.floor(Math.random() * 62)
        )
    ).join('');
    document.getElementById("password").value = password;
}

// 文本复制功能
function copyToClipboard(elementId) {
    const textElement = document.getElementById(elementId);
    const textToCopy = textElement.value || textElement.innerText;
    if (!textToCopy) {
        alert(languageContent.alerts.copyError);
        return;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert(languageContent.alerts.copySuccess);
    }).catch(err => {
        alert(languageContent.alerts.copyFailure);
        console.error(err);
    });
}

// 加密文本
function encryptText() {
    const text = document.getElementById("inputText").value.trim();
    const passwordInput = document.getElementById("password").value.trim();

    if (!text) {
        alert(languageContent.alerts.noText);
        return;
    }

    const key = passwordInput
        ? CryptoJS.enc.Utf8.parse(CryptoJS.MD5(passwordInput).toString().slice(0, 16))
        : defaultKey;

    const encrypted = CryptoJS.AES.encrypt(text, key, {
        mode: CryptoJS.mode.ECB,
        padding: CryptoJS.pad.Pkcs7
    }).toString();

    document.getElementById("resultText").value = encrypted;
    autoResizeTextArea("resultText");
    alert(languageContent.alerts.encryptionSuccess);
}

// 解密文本
function decryptText() {
    const encryptedText = document.getElementById("inputText").value.trim();
    const passwordInput = document.getElementById("password").value.trim();

    if (!encryptedText) {
        alert(languageContent.alerts.noEncryptedText);
        return;
    }

    const key = passwordInput
        ? CryptoJS.enc.Utf8.parse(CryptoJS.MD5(passwordInput).toString().slice(0, 16))
        : defaultKey;

    try {
        const decrypted = CryptoJS.AES.decrypt(encryptedText, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }).toString(CryptoJS.enc.Utf8);

        document.getElementById("resultText").value = decrypted;
        autoResizeTextArea("resultText");
    } catch (e) {
        document.getElementById("resultText").value = languageContent.alerts.decryptionFailure;
        autoResizeTextArea("resultText");
    }
}

// 自动调整结果文本框大小
function autoResizeTextArea(elementId) {
    const textarea = document.getElementById(elementId);
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
}

// 语言切换
let languageContent = {
    title: "加密与解密工具",
    inputLabel: "请输入文本:",
    passwordLabel: "密码 (可选):",
    resultLabel: "结果:",
    buttons: {
        encrypt: "加密",
        decrypt: "解密",
        generatePassword: "生成密码",
        copy: "复制"
    },
    alerts: {
        copyError: "没有内容可复制。",
        copySuccess: "已复制到剪贴板！",
        copyFailure: "复制失败。",
        noText: "请输入要加密的文本。",
        noEncryptedText: "请输入要解密的文本。",
        encryptionSuccess: "加密成功！",
        decryptionFailure: "解密失败，请检查密码。"
    }
};
