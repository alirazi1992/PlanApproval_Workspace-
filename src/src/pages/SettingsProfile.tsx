import { useState } from "react";
import { AppShell } from "../components/layout/AppShell";
import { Card } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Switch } from "../components/ui/Switch";
import { useAuth } from "../features/auth/AuthContext";

export function SettingsProfile() {
  const { user } = useAuth();
  const [isRTL, setIsRTL] = useState(false);
  const [language, setLanguage] = useState("en");

  const handleRTLToggle = (checked: boolean) => {
    setIsRTL(checked);
    document.documentElement.dir = checked ? "rtl" : "ltr";
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6 text-right">
        <h1 className="text-2xl font-bold text-gray-900">تنظیمات پروفایل</h1>

        <Card variant="glass" className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            اطلاعات شخصی
          </h2>
          <div className="space-y-4">
            <Input label="نام" defaultValue={user?.name} />
            <Input label="ایمیل" type="email" defaultValue={user?.email} />
            <Button variant="primary">ذخیره تغییرات</Button>
          </div>
        </Card>

        <Card variant="glass" className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            زبان و جهت نمایش
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                انتخاب زبان
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 text-right"
              >
                <option value="en">انگلیسی (en-US)</option>
                <option value="fa">فارسی (fa-IR)</option>
              </select>
            </div>
            <Switch
              checked={isRTL}
              onChange={handleRTLToggle}
              label="فعال‌سازی حالت راست‌به‌چپ (RTL)"
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
