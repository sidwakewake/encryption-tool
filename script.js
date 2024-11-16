const languages = {
    zh: {
        title: "加密与解密工具",
        inputLabel: "请输入文本:",
        passwordLabel: "密码 (可选):",
        resultLabel: "结果:",
        generateBtn: "生成密码",
        encryptBtn: "加密",
        decryptBtn: "解密",
        copyBtn: "复制",
        processing: "处理中...",
        messages: {
            copied: "已复制到剪贴板！",
            copyFailed: "复制失败",
            noInput: "请输入要处理的文本",
            processingError: "处理失败，请检查输入和密码",
            success: "处理成功！"
        }
    },
    en: {
        title: "Encryption & Decryption Tool",
        inputLabel: "Enter Text:",
        passwordLabel: "Password (Optional):",
        resultLabel: "Result:",
        generateBtn: "Generate Password",
        encryptBtn: "Encrypt",
        decryptBtn: "Decrypt",
        copyBtn: "Copy",
        processing: "Processing...",
        messages: {
            copied: "Copied to clipboard!",
            copyFailed: "Failed to copy",
            noInput: "Please enter text to process",
            processingError: "Processing failed, please check input and password",
            success: "Processing successful!"
        }
    }
};

function TextProcessor({ currentLang }) {
    const [isProcessing, setIsProcessing] = React.useState(false);
    const CHUNK_SIZE = 5000;
    const MAX_PARALLEL_CHUNKS = 5;

    async function getKey(password) {
        const defaultKey = "DefaultFixedKey12345";
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(password || defaultKey),
            { name: "PBKDF2" },
            false,
            ["deriveBits", "deriveKey"]
        );

        return crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: new TextEncoder().encode("salt"),
                iterations: 100000,
                hash: "SHA-256",
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
    }

    function generatePassword() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const password = Array(12)
            .fill(0)
            .map(() => chars[Math.floor(Math.random() * chars.length)])
            .join("");
        document.getElementById("password").value = password;
    }

    function copyText(elementId) {
        const text = document.getElementById(elementId).value;
        if (!text) return;
        navigator.clipboard
            .writeText(text)
            .then(() => alert(languages[currentLang].messages.copied))
            .catch(() => alert(languages[currentLang].messages.copyFailed));
    }

    function autoResize(textarea) {
        textarea.style.height = "auto";
        textarea.style.height = textarea.scrollHeight + "px";
    }

    function uint8ArrayToBase64Url(uint8Array) {
        return btoa(String.fromCharCode(...uint8Array))
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
    }

    function base64UrlToUint8Array(base64Url) {
        const base64 = base64Url
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(base64Url.length + (4 - (base64Url.length % 4)) % 4, "=");
        return new Uint8Array(
            atob(base64)
                .split("")
                .map((char) => char.charCodeAt(0))
        );
    }

    async function compressText(text) {
        try {
            const textBytes = new TextEncoder().encode(text);
            const cs = new CompressionStream("deflate");
            const writer = cs.writable.getWriter();
            writer.write(textBytes);
            writer.close();
            const compressedChunks = [];
            const reader = cs.readable.getReader();
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                compressedChunks.push(value);
            }
            const totalLength = compressedChunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const compressed = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of compressedChunks) {
                compressed.set(chunk, offset);
                offset += chunk.length;
            }
            return compressed;
        } catch (error) {
            console.error("Compression failed:", error);
            return new TextEncoder().encode(text);
        }
    }

    async function decompressData(data) {
        try {
            const ds = new DecompressionStream("deflate");
            const writer = ds.writable.getWriter();
            writer.write(data);
            writer.close();
            const decompressedChunks = [];
            const reader = ds.readable.getReader();
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                decompressedChunks.push(value);
            }
            const totalLength = decompressedChunks.reduce((acc, chunk) => acc + chunk.length, 0);
            const decompressed = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of decompressedChunks) {
                decompressed.set(chunk, offset);
                offset += chunk.length;
            }
            return new TextDecoder().decode(decompressed);
        } catch (error) {
            console.error("Decompression failed:", error);
            return new TextDecoder().decode(data);
        }
    }

    async function processChunksBatch(chunks, password, isEncrypt) {
        const results = [];
        for (let i = 0; i < chunks.length; i += MAX_PARALLEL_CHUNKS) {
            const batch = chunks.slice(i, i + MAX_PARALLEL_CHUNKS);
            const batchPromises = batch.map(async (chunk) => {
                const key = await getKey(password);
                if (isEncrypt) {
                    const compressedData = await compressText(chunk);
                    const iv = crypto.getRandomValues(new Uint8Array(12));
                    const encrypted = await crypto.subtle.encrypt(
                        { name: "AES-GCM", iv },
                        key,
                        compressedData
                    );
                    const combined = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
                    return uint8ArrayToBase64Url(combined);
                } else {
                    try {
                        const combined = base64UrlToUint8Array(chunk);
                        const iv = combined.slice(0, 12);
                        const encrypted = combined.slice(12);
                        const decrypted = await crypto.subtle.decrypt(
                            { name: "AES-GCM", iv },
                            key,
                            encrypted
                        );
                        return await decompressData(new Uint8Array(decrypted));
                    } catch (error) {
                        throw new Error(languages[currentLang].messages.processingError);
                    }
                }
            });

            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
        }
        return results;
    }

    async function processInChunks(text, password, isEncrypt) {
        const chunks = isEncrypt
            ? Array.from({ length: Math.ceil(text.length / CHUNK_SIZE) }, (_, i) =>
                text.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
            )
            : text.split(".").filter((chunk) => chunk);

        const results = await processChunksBatch(chunks, password, isEncrypt);
        return isEncrypt ? results.join(".") : results.join("");
    }

    async function handleProcess(isEncrypt) {
        if (isProcessing) return;

        const text = document.getElementById("inputText").value.trim();
        const password = document.getElementById("password").value;

        if (!text) {
            alert(languages[currentLang].messages.noInput);
            return;
        }

        setIsProcessing(true);

        try {
            const result = await processInChunks(text, password, isEncrypt);
            const resultTextarea = document.getElementById("result");
            resultTextarea.value = result;
            autoResize(resultTextarea);
            alert(languages[currentLang].messages.success);
        } catch (error) {
            alert(error.message);
        } finally {
            setIsProcessing(false);
        }
    }

    const content = languages[currentLang];

    return React.createElement("div", { className: "processor-container" },
        React.createElement("div", { className: "input-group" },
            React.createElement("div", { className: "input-header" },
                React.createElement("label", {}, content.inputLabel),
                React.createElement("button", {
                    onClick: () => copyText("inputText"),
                    className: "copy-icon",
                }, content.copyBtn)
            ),
            React.createElement("textarea", { id: "inputText", placeholder: content.inputLabel })
        ),
        React.createElement("div", { className: "input-group" },
            React.createElement("div", { className: "input-header" },
                React.createElement("label", {}, content.passwordLabel),
                React.createElement("button", {
                    onClick: () => copyText("password"),
                    className: "copy-icon",
                }, content.copyBtn)
            ),
            React.createElement("div", { className: "password-row" },
                React.createElement("input", {
                    type: "text",
                    id: "password",
                    placeholder: content.passwordLabel,
                }),
                React.createElement("button", {
                    onClick: generatePassword,
                    id: "generate-btn",
                }, content.generateBtn)
            )
        ),
        React.createElement("div", { className: "input-group" },
            React.createElement("div", { className: "input-header" },
                React.createElement("label", {}, content.resultLabel),
                React.createElement("button", {
                    onClick: () => copyText("result"),
                    className: "copy-icon",
                }, content.copyBtn)
            ),
            React.createElement("textarea", {
                id: "result",
                className: "auto-resize",
                readOnly: true,
            })
        ),
        React.createElement("div", { className: "button-group" },
            React.createElement("button", {
                onClick: () => handleProcess(true),
                id: "encrypt-btn",
                disabled: isProcessing,
            }, isProcessing ? content.processing : content.encryptBtn),
            React.createElement("button", {
                onClick: () => handleProcess(false),
                id: "decrypt-btn",
                disabled: isProcessing,
            }, isProcessing ? content.processing : content.decryptBtn)
        )
    );
}

function switchLanguage(lang) {
    const content = languages[lang];
    document.getElementById("app-title").textContent = content.title;

    document.querySelectorAll(".lang-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.textContent === (lang === "zh" ? "中文" : "English"));
    });

    ReactDOM.render(
        React.createElement(TextProcessor, { currentLang: lang }),
        document.getElementById("root")
    );
}

// 默认渲染中文
ReactDOM.render(
    React.createElement(TextProcessor, { currentLang: "zh" }),
    document.getElementById("root")
);