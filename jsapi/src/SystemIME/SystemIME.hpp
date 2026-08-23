// Copyright (C) 2025 Langning Chen
//
// This file is part of miniapp.
//
// miniapp is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// miniapp is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with miniapp.  If not see <https://www.gnu.org/licenses/>.

#pragma once

#include <jqutil_v2/jqutil.h>
#include <memory>
#include <string>
#include "JQuickContext.h"

using namespace JQUTIL_NS;

// 系统自带输入法（有道输入法）的 appId。
// 真机上这是一个独立 miniapp，通过 softKeyboard 服务拉起。
#ifndef SYSTEM_IME_APPID
#define SYSTEM_IME_APPID "8001666679481944"
#endif

class JSSystemIME : public JQPublishObject
{
public:
    JSSystemIME();
    ~JSSystemIME();

    // 拉起系统输入法软键盘。options 可携带 hint 等。
    void open(JQFunctionInfo &info);
    // 关闭系统输入法软键盘（回到本应用）。
    void close(JQFunctionInfo &info);
    // 当前是否有软键盘在前台。
    void isOpen(JQFunctionInfo &info);

private:
    bool kbOpen = false;
    // 通过 miniapp_cli 拉起系统输入法服务（与 ScanInput 机制一致，已验证可用）。
    void launchSystemKeyboard(const std::string &hint);
    void closeSystemKeyboard();
};

extern JSValue createSystemIME(JQModuleEnv *env);
