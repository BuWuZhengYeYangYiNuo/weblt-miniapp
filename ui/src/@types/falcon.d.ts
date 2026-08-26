type HttpRequestMethod = 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
type HttpResponse = {
    statusCode: number,
    headers: { [key: string]: string },
    data: any,
    statusText?: string,
    error?: string
}

type Falcon = {
    on<T>(eventName: string, callback: FalconCallback<T>): void,
    off<T>(eventName: string, callback?: FalconCallback<T>): void,
    trigger<T>(eventName: string, data: T): void,
    navTo<T>(target: string, options: T): void,
    jsapi: {
        storage: {
            // 文档明确：字段名是 value，不是 data；返回 string 不是 {data: string}
            setItem(params: { key: string; value: string }): Promise<any>;
            getItem(params: { key: string }): Promise<string>;
            removeItem(params: { key: string }): Promise<any>;
        },
        net: {
            request(params: {
                url: string,
                method?: HttpRequestMethod,
                headers?: { [key: string]: string },
                data?: any,
                timeout?: number,
            }): Promise<HttpResponse>;
        },
        ui: {
            showToast(params: { message: string }): void;
            showLoading(params?: { message?: string }): void;
            hideLoading(): void;
            showAlert(params: { title: string; content: string; confirmText?: string }): Promise<void>;
            showConfirm(params: { title: string; content: string; confirmText?: string; cancelText?: string }): Promise<{ confirm: boolean }>;
        },
        // 扫码模块（保留编译，前端当前未使用）。
        ScanInput: {
            initialize(): Promise<void>;
            deinitialize(): Promise<void>;
            showKeyboard(): Promise<void>;
        },
        // 本地拼音输入法引擎（IME）：自绘键盘调用它做拼音→汉字转换，
        // 不依赖系统输入法，词库在构建时由 rawdict_utf16_65105_freq.txt 生成。
        IME: {
            initialize(): Promise<void>;
            // 同步方法（运行时不保证包装为 Promise，前端用 await 兼容）。
            // 返回候选数组：[{ hanZi: string, freq: number, pinyin: string[] }]
            getCandidates(rawPinyin: string): any;
            updateWordFrequency(pinyin: string[], hanZi: string): any;
            splitPinyin(rawPinyin: string): any;
        }
    },
    closeApp: () => void,
    closePageByName: (pageName: string) => void,
    closePageById: (pageId: string) => void,
    $app: {
        finish: () => void,
    }
};

type FalconEvent<T> = {
    type: string,
    timestamp: string,
    data: T
};

type FalconCallback<T> = (data: FalconEvent<T>) => void;

declare const $falcon: Falcon;

type FalconPage<T> = {
    $falcon: Falcon,
    $root: Object,
    $pageName: string,
    $pageId: string,
    loadOptions: T,
    newOptions: T,
    setRootComponent: (component: any) => void,
    finish: () => void,
    $npage: {
        setSupportBack: (support: boolean) => void
        on: (eventName: string, callback: () => void) => void
        off: (eventName: string, callback: () => void) => void
    }
    on: (eventName: string, callback: () => void) => void
    off: (eventName: string, callback: () => void) => void
}
