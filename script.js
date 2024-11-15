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

function TextProcessor() {
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [currentLang, setCurrentLang] = React.useState('zh');
    const CHUNK_SIZE = 10000;

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

    function generatePassword() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const password = Array(12).fill(0)
            .map(() => chars[Math.floor(Math.random() * chars.length)])
            .join('');
        document.getElementById('password').value = password;
    }

    function copyText(elementId) {
        const text = document.getElementById(elementId).value;
        if (!text) return;
        navigator.clipboard.writeText(text)
            .then(() => alert(languages[currentLang].messages.copied))
            .catch(() => alert(languages[currentLang].messages.copyFailed));
    }

    function autoResize(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    async function processInChunks(text, password, isEncrypt) {
        if (isEncrypt) {
            const chunks = [];
            for (let i = 0; i < text.length; i += CHUNK_SIZE) {
                chunks.push(text.slice(i, i + CHUNK_SIZE));
            }

            let result = '';
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const key = await getKey(password);
                const iv = crypto.getRandomValues(new Uint8Array(12));
                const encoded = new TextEncoder().encode(chunk);
                const encrypted = await crypto.subtle.encrypt(
                    { name: 'AES-GCM', iv },
                    key,
                    encoded
                );
                const combined = new Uint8Array([...iv, ...new Uint8Array(encrypted)]);
                result += btoa(String.fromCharCode(...combined)) + '|';
            }
            return result;
        } else {
            const chunks = text.split('|');
            let result = '';
            
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                if (!chunk) continue;
                
                try {
                    const key = await getKey(password);
                    const combined = new Uint8Array(
                        atob(chunk).split('').map(char => char.charCodeAt(0))
                    );
                    const iv = combined.slice(0, 12);
                    const encrypted = combined.slice(12);
                    const decrypted = await crypto.subtle.decrypt(
                        { name: 'AES-GCM', iv },
                        key,
                        encrypted
                    );
                    result += new TextDecoder().decode(decrypted);
                } catch (error) {
                    console.error(error);
                    throw new Error(languages[currentLang].messages.processingError);
                }
            }
            return result;
        }
    }

    async function handleProcess(isEncrypt) {
        if (isProcessing) return;

        const text = document.getElementById('inputText').value.trim();
        const password = document.getElementById('password').value;

        if (!text) {
            alert(languages[currentLang].messages.noInput);
            return;
        }

        setIsProcessing(true);

        try {
            const result = await processInChunks(text, password, isEncrypt);
            const resultTextarea = document.getElementById('result');
            resultTextarea.value = result;
            autoResize(resultTextarea);
            alert(languages[currentLang].messages.success);
        } catch (error) {
            alert(error.message);
        } finally {
            setIsProcessing(false);
        }
    }

    return React.createElement('div', { className: 'processor-container' },
        React.createElement('div', { className: 'input-group' },
            React.createElement('div', { className: 'input-header' },
                React.createElement('label', {}, languages[currentLang].inputLabel),
                React.createElement('button', {
                    onClick: () => copyText('inputText'),
                    className: 'copy-icon'
                }, languages[currentLang].copyBtn)
            ),
            React.createElement('textarea', {
                id: 'inputText',
                placeholder: languages[currentLang].inputLabel
            })
        ),
        React.createElement('div', { className: 'input-group' },
            React.createElement('div', { className: 'input-header' },
                React.createElement('label', {}, languages[currentLang].passwordLabel),
                React.createElement('button', {
                    onClick: () => copyText('password'),
                    className: 'copy-icon'
                }, languages[currentLang].copyBtn)
            ),
            React.createElement('div', { className: 'password-row' },
                React.createElement('input', {
                    type: 'text',
                    id: 'password',
                    placeholder: languages[currentLang].passwordLabel
                }),
                React.createElement('button', {
                    onClick: generatePassword,
                    id: 'generate-btn'
                }, languages[currentLang].generateBtn)
            )
        ),
        React.createElement('div', { className: 'input-group' },
            React.createElement('div', { className: 'input-header' },
                React.createElement('label', {}, languages[currentLang].resultLabel),
                React.createElement('button', {
                    onClick: () => copyText('result'),
                    className: 'copy-icon'
                }, languages[currentLang].copyBtn)
            ),
            React.createElement('textarea', {
                id: 'result',
                className: 'auto-resize',
                readOnly: true,
                onChange: (e) => autoResize(e.target)
            })
        ),
        React.createElement('div', { className: 'button-group' },
            React.createElement('button', {
                onClick: () => handleProcess(true),
                id: 'encrypt-btn',
                disabled: isProcessing
            }, isProcessing ? languages[currentLang].processing : languages[currentLang].encryptBtn),
            React.createElement('button', {
                onClick: () => handleProcess(false),
                id: 'decrypt-btn',
                disabled: isProcessing
            }, isProcessing ? languages[currentLang].processing : languages[currentLang].decryptBtn)
        )
    );
}

function switchLanguage(lang) {
    const content = languages[lang];
    document.getElementById('app-title').textContent = content.title;
    
    window.currentLang = lang;
    
    ReactDOM.render(
        React.createElement(TextProcessor),
        document.getElementById('root')
    );

    document.querySelectorAll('.lang-btn').forEach(btn => {
        if (lang === 'zh') {
            btn.classList.toggle('active', btn.textContent === '中文');
        } else {
            btn.classList.toggle('active', btn.textContent === 'English');
        }
    });
}

// Initialize
ReactDOM.render(
    React.createElement(TextProcessor),
    document.getElementById('root')
);