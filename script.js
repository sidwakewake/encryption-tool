const languages = {
    zh: {
        title: "压缩加密工具",
        inputLabel: "请输入文本:",
        passwordLabel: "密码 (可选):",
        resultLabel: "结果:",
        generateBtn: "生成密码",
        encryptBtn: "压缩并加密",
        decryptBtn: "解密并解压",
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
        title: "Compression & Encryption Tool",
        inputLabel: "Enter Text:",
        passwordLabel: "Password (Optional):",
        resultLabel: "Result:",
        generateBtn: "Generate Password",
        encryptBtn: "Compress & Encrypt",
        decryptBtn: "Decrypt & Decompress",
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

let currentLang = 'zh';
let isProcessing = false;

async function compressData(text) {
    const cs = new CompressionStream('gzip');
    const writer = cs.writable.getWriter();
    writer.write(new TextEncoder().encode(text));
    writer.close();
    return new Response(cs.readable).arrayBuffer();
}

async function decompressData(compressedData) {
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(compressedData);
    writer.close();
    return new TextDecoder().decode(
        await new Response(ds.readable).arrayBuffer()
    );
}

async function getKey(password) {
    const defaultKey = 'DefaultFixedKey12345';
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password || defaultKey),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: new TextEncoder().encode('salt'),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

async function handleEncrypt() {
    if (isProcessing) return;

    const text = document.getElementById('inputText').value.trim();
    const password = document.getElementById('password').value;

    if (!text) {
        alert(languages[currentLang].messages.noInput);
        return;
    }

    setProcessing(true);
    
    try {
        const compressed = await compressData(text);
        const key = await getKey(password);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            compressed
        );

        const combined = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
        document.getElementById('result').value = btoa(String.fromCharCode(...combined));
        alert(languages[currentLang].messages.success);
    } catch (error) {
        console.error(error);
        alert(languages[currentLang].messages.processingError);
    } finally {
        setProcessing(false);
    }
}

async function handleDecrypt() {
    if (isProcessing) return;

    const text = document.getElementById('inputText').value.trim();
    const password = document.getElementById('password').value;

    if (!text) {
        alert(languages[currentLang].messages.noInput);
        return;
    }

    setProcessing(true);

    try {
        const combined = new Uint8Array(
            atob(text).split('').map(char => char.charCodeAt(0))
        );

        const iv = combined.slice(0, 12);
        const encrypted = combined.slice(12);
        const key = await getKey(password);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            encrypted
        );

        const decompressed = await decompressData(decrypted);
        document.getElementById('result').value = decompressed;
        alert(languages[currentLang].messages.success);
    } catch (error) {
        console.error(error);
        alert(languages[currentLang].messages.processingError);
    } finally {
        setProcessing(false);
    }
}

function generatePassword() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const password = Array(12).fill(0)
        .map(() => chars[Math.floor(Math.random() * chars.length)])
        .join('');
    document.getElementById('password').value = password;
}

async function copyToClipboard() {
    const text = document.getElementById('result').value;
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);
        alert(languages[currentLang].messages.copied);
    } catch {
        alert(languages[currentLang].messages.copyFailed);
    }
}

function setProcessing(processing) {
    isProcessing = processing;
    const encryptBtn = document.getElementById('encrypt-btn');
    const decryptBtn = document.getElementById('decrypt-btn');
    const generateBtn = document.getElementById('generate-btn');

    [encryptBtn, decryptBtn, generateBtn].forEach(btn => {
        btn.disabled = processing;
    });

    if (processing) {
        encryptBtn.textContent = languages[currentLang].processing;
        decryptBtn.textContent = languages[currentLang].processing;
    } else {
        encryptBtn.textContent = languages[currentLang].encryptBtn;
        decryptBtn.textContent = languages[currentLang].decryptBtn;
    }
}

function switchLanguage(lang) {
    currentLang = lang;
    const content = languages[lang];

    document.getElementById('app-title').textContent = content.title;
    document.getElementById('input-label').textContent = content.inputLabel;
    document.getElementById('password-label').textContent = content.passwordLabel;
    document.getElementById('result-label').textContent = content.resultLabel;
    document.getElementById('generate-btn').textContent = content.generateBtn;
    document.getElementById('encrypt-btn').textContent = content.encryptBtn;
    document.getElementById('decrypt-btn').textContent = content.decryptBtn;
    document.getElementById('copy-btn').textContent = content.copyBtn;

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(lang));
    });
}

// Initialize
switchLanguage('zh');