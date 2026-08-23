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

#include "SystemIME.hpp"
#include <unistd.h>
#include <cstdio>

JSSystemIME::JSSystemIME() {}
JSSystemIME::~JSSystemIME() {}

void JSSystemIME::launchSystemKeyboard(const std::string &hint)
{
    // 系统输入法是独立 miniapp，通过 miniapp_cli 以 softKeyboard 服务拉起。
    // 这与 ScanInput 拉起软键盘的机制完全一致，已在真机验证可用。
    std::string cmd = "miniapp_cli start " SYSTEM_IME_APPID " softKeyboard";
    if (!hint.empty())
    {
        // 把输入框提示作为 option 透传（系统输入法可能忽略，但不影响拉起）。
        cmd += " '" + hint + "'";
    }
    // 不检查返回值：设备无 miniapp_cli 时静默失败，前端回退到自绘键盘。
    system(cmd.c_str());
    kbOpen = true;
}

void JSSystemIME::closeSystemKeyboard()
{
    // 系统输入法作为前台 app，完成输入后会自动退到后台、本 miniapp 回到前台，
    // 因此无需主动 close。miniapp_cli 仅验证过 install/start 两个子命令。
    kbOpen = false;
}

void JSSystemIME::open(JQFunctionInfo &info)
{
    try
    {
        ASSERT(info.Length() <= 1);
        std::string hint;
        if (info.Length() == 1)
        {
            JSContext *ctx = info.GetContext();
            hint = JQString(ctx, info[0]).getString();
        }
        launchSystemKeyboard(hint);
        // 通知前端：系统输入法已拉起，自绘键盘应隐藏。
        Bson::object state;
        state["open"] = true;
        publish("system_ime_state", state);
        info.GetReturnValue().Set(true);
    }
    catch (const std::exception &e)
    {
        info.GetReturnValue().ThrowInternalError(e.what());
    }
}

void JSSystemIME::close(JQFunctionInfo &info)
{
    try
    {
        ASSERT(info.Length() == 0);
        closeSystemKeyboard();
        Bson::object state;
        state["open"] = false;
        publish("system_ime_state", state);
        info.GetReturnValue().Set(true);
    }
    catch (const std::exception &e)
    {
        info.GetReturnValue().ThrowInternalError(e.what());
    }
}

void JSSystemIME::isOpen(JQFunctionInfo &info)
{
    try
    {
        ASSERT(info.Length() == 0);
        info.GetReturnValue().Set(kbOpen);
    }
    catch (const std::exception &e)
    {
        info.GetReturnValue().ThrowInternalError(e.what());
    }
}

JSValue createSystemIME(JQModuleEnv *env)
{
    JQFunctionTemplateRef tpl = JQFunctionTemplate::New(env, "SystemIME");
    tpl->InstanceTemplate()->setObjectCreator([]()
                                              { return new JSSystemIME(); });

    tpl->SetProtoMethod("open", &JSSystemIME::open);
    tpl->SetProtoMethod("close", &JSSystemIME::close);
    tpl->SetProtoMethod("isOpen", &JSSystemIME::isOpen);

    JSSystemIME::InitTpl(tpl);
    return tpl->CallConstructor();
}
