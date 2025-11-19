import { useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Switch } from "../components/ui/Switch";

export function SettingsSecurity() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6 text-right">
        <h1 className="text-2xl font-bold text-gray-900">تنظیمات امنیتی</h1>

        <Card variant="glass" className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            تغییر رمز عبور
          </h2>
          <div className="space-y-4">
            <Input label="رمز عبور فعلی" type="password" />
            <Input label="رمز عبور جدید" type="password" />
            <Input label="تکرار رمز عبور جدید" type="password" />
            <Button variant="primary">به‌روزرسانی رمز عبور</Button>
          </div>
        </Card>

        <Card variant="glass" className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            ورود دو مرحله‌ای
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              با فعال‌سازی ورود دو مرحله‌ای، یک لایه امنیتی اضافه به حساب شما
              اضافه می‌شود و در هر ورود علاوه بر رمز عبور، یک کد تأیید نیز لازم
              خواهد بود.
            </p>

            <Switch
              checked={twoFactorEnabled}
              onChange={setTwoFactorEnabled}
              label="فعال‌سازی ورود دو مرحله‌ای"
            />

            {twoFactorEnabled && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-900">
                  ورود دو مرحله‌ای اکنون فعال است. از این پس هنگام ورود، علاوه
                  بر رمز عبور باید کدی را که در برنامه احراز هویت
                  (Authenticator) نمایش داده می‌شود وارد کنید.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
