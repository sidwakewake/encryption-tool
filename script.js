const languages = {
    zh: {
        title: "压缩加密工具",
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
        title: "Encryption Tool",
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
 
 let currentLang = 'zh';
 let isProcessing = false;
 
 function compressLZ(str) {
    const dict = {};
    let data = (str + "").split("");
    let out = [];
    let phrase = data[0];
    let code = 256;
    
    for (let i=1; i<data.length; i++) {
        let curr = data[i];
        if (dict[phrase + curr] != null) {
            phrase += curr;
        } else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + curr] = code;
            code++;
            phrase = curr;
        }
    }
    
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    
    const compressedData = new Uint8Array(new Int16Array(out).buffer);
    return btoa(String.fromCharCode(...compressedData));
 }
 
 function decompressLZ(str) {
    const compressedData = new Uint8Array(
        atob(str).split('').map(char => char.charCodeAt(0))
    );
    const data = new Int16Array(compressedData.buffer);
    
    const dict = {};
    const out = [];
    let code = 256;
    let phrase = String.fromCharCode(data[0]);
    out.push(phrase);
    
    for (let i=1; i<data.length; i++) {
        let curr = data[i];
        let entry;
        
        if (curr < 256) {
            entry = String.fromCharCode(curr);
        } else if (dict[curr] != null) {
            entry = dict[curr];
        } else {
            entry = phrase + phrase.charAt(0);
        }
        
        out.push(entry);
        dict[code] = phrase + entry.charAt(0);
        code++;
        phrase = entry;
    }
    
    return out.join('');
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
        const compressed = compressLZ(text);
        const key = await getKey(password);
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(compressed);
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoded
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
 
        const decoded = new TextDecoder().decode(decrypted);
        const decompressed = decompressLZ(decoded);
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