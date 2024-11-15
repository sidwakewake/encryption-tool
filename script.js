const defaultKey = CryptoJS.enc.Utf8.parse("DefaultFixedKey12345");

// 定义全局变量用于调整压缩和解压次数
const compressionIterations = 3; // 可根据需要调整压缩次数

// 多语言配置
const languages = {
    zh: {
        title: "加密与解密工具",
        inputLabel: "请输入文本:",
        passwordLabel: "密码 (可选):",
        resultLabel: "结果:",
        placeholders: {
            inputText: "请输入要加密或解密的文本",
            password: "输入密码或自动生成",
            resultText: "加密或解密结果将显示在此"
        },
        buttons: {
            encrypt: "加密",
            decrypt: "解密",
            generatePassword: "生成密码",
            copy: "复制"
        },
        alerts: {
            noText: "请输入要加密的文本！",
            noEncryptedText: "请输入要解密的文本！",
            compressionFailed: "压缩失败！",
            decompressionFailed: "解压失败或密码错误！",
            copySuccess: "复制成功！",
            copyFailure: "复制失败！",
            noContentToCopy: "没有内容可复制！"
        }
    },
    en: {
        title: "Encryption and Decryption Tool",
        inputLabel: "Enter Text:",
        passwordLabel: "Password (Optional):",
        resultLabel: "Result:",
        placeholders: {
            inputText: "Enter text to encrypt or decrypt",
            password: "Enter password or generate automatically",
            resultText: "Encrypted or decrypted result will appear here"
        },
        buttons: {
            encrypt: "Encrypt",
            decrypt: "Decrypt",
            generatePassword: "Generate Password",
            copy: "Copy"
        },
        alerts: {
            noText: "Please enter text to encrypt!",
            noEncryptedText: "Please enter text to decrypt!",
            compressionFailed: "Compression failed!",
            decompressionFailed: "Decompression failed or incorrect password!",
            copySuccess: "Copied successfully!",
            copyFailure: "Copy failed!",
            noContentToCopy: "No content to copy!"
        }
    }
};

// 当前语言配置，默认中文
let languageContent = languages.zh;

// 切换语言
function switchLanguage(lang) {
    languageContent = languages[lang];

    // 更新页面文本
    document.getElementById("app-title").innerText = languageContent.title;
    document.getElementById("input-label").innerText = languageContent.inputLabel;
    document.getElementById("password-label").innerText = languageContent.passwordLabel;
    document.getElementById("result-label").innerText = languageContent.resultLabel;

    document.getElementById("inputText").placeholder = languageContent.placeholders.inputText;
    document.getElementById("password").placeholder = languageContent.placeholders.password;
    document.getElementById("resultText").placeholder = languageContent.placeholders.resultText;

    document.getElementById("encrypt-btn").innerText = languageContent.buttons.encrypt;
    document.getElementById("decrypt-btn").innerText = languageContent.buttons.decrypt;
    document.getElementById("password-generate-btn").innerText = languageContent.buttons.generatePassword;
    document.getElementById("input-copy-btn").innerText = languageContent.buttons.copy;
    document.getElementById("password-copy-btn").innerText = languageContent.buttons.copy;
    document.getElementById("result-copy-btn").innerText = languageContent.buttons.copy;
}

// 文本复制功能
function copyToClipboard(elementId) {
    const textElement = document.getElementById(elementId);
    const textToCopy = textElement.value || textElement.innerText;
    if (!textToCopy) {
        alert(languageContent.alerts.noContentToCopy);
        return;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
        alert(languageContent.alerts.copySuccess);
    }).catch(err => {
        alert(languageContent.alerts.copyFailure);
        console.error(err);
    });
}

// 自动调整文本框大小（仅限结果框）
function autoResizeTextArea(elementId) {
    const textarea = document.getElementById(elementId);
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
}

// 随机生成密码
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

// 多次压缩文本
function compressTextMultiple(plainText, iterations) {
    let data = new TextEncoder().encode(plainText); // 转换为 UTF-8 编码
    try {
        for (let i = 0; i < iterations; i++) {
            data = pako.deflate(data);
        }
        return data; // 返回 Uint8Array
    } catch (e) {
        console.error("Compression failed:", e);
        throw new Error(languageContent.alerts.compressionFailed);
    }
}

// 多次解压文本
function decompressTextMultiple(compressedData, iterations) {
    let data = compressedData; // 输入数据为 Uint8Array
    try {
        for (let i = 0; i < iterations; i++) {
            data = pako.inflate(data);
        }
        return new TextDecoder().decode(data); // 转换回字符串
    } catch (e) {
        console.error("Decompression failed:", e);
        throw new Error(languageContent.alerts.decompressionFailed);
    }
}

// 加密文本
function encryptText() {
    const text = document.getElementById("inputText").value.trim();
    const passwordInput = document.getElementById("password").value.trim();

    if (!text) {
        alert(languageContent.alerts.noText);
        return;
    }

    try {
        const compressedText = compressTextMultiple(text, compressionIterations); // 使用动态压缩次数
        const compressedBase64 = btoa(String.fromCharCode.apply(null, compressedText));

        const key = passwordInput
            ? CryptoJS.enc.Utf8.parse(CryptoJS.MD5(passwordInput).toString().slice(0, 16))
            : defaultKey;

        const encrypted = CryptoJS.AES.encrypt(compressedBase64, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }).toString();

        document.getElementById("resultText").value = encrypted;
        autoResizeTextArea("resultText");
    } catch (e) {
        alert(languageContent.alerts.compressionFailed);
        console.error("Error during encryption:", e);
    }
}

// 解密文本
function decryptText() {
    const encryptedText = document.getElementById("inputText").value.trim();
    const passwordInput = document.getElementById("password").value.trim();

    if (!encryptedText) {
        alert(languageContent.alerts.noEncryptedText);
        return;
    }

    try {
        const key = passwordInput
            ? CryptoJS.enc.Utf8.parse(CryptoJS.MD5(passwordInput).toString().slice(0, 16))
            : defaultKey;

        const decrypted = CryptoJS.AES.decrypt(encryptedText, key, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }).toString(CryptoJS.enc.Utf8);

        const compressedBinary = Uint8Array.from(atob(decrypted), c => c.charCodeAt(0));
        const decompressedText = decompressTextMultiple(compressedBinary, compressionIterations); // 使用动态解压次数

        document.getElementById("resultText").value = decompressedText;
        autoResizeTextArea("resultText");
    } catch (e) {
        alert(languageContent.alerts.decompressionFailed);
        console.error("Error during decryption:", e);
    }
}
