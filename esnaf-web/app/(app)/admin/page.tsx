"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/store/auth";
import { getDemoUsers, roleLabel, saveDemoUsers } from "@/lib/auth";
import { Branch, Business, BusinessApplication, BusinessPlan, DemoUser, Role, Sale } from "@/lib/types";
import { branchLabel } from "@/lib/branches";
import { withBusinessId } from "@/lib/tenant";
import { fmtTRY } from "@/lib/money";

const periodDays = [
  { label: "Aylık", days: 30 },
  { label: "Çeyreklik", days: 90 },
  { label: "Yıllık", days: 365 },
];

export default function AdminPage() {
  const user = useAuth((state) => state.user);
  const businessId = user?.role === "YONETIM" ? null : user?.businessId ?? null;
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchName, setBranchName] = useState("");
  const [form, setForm] = useState({
    name: "",
    username: "",
    role: "PERSONEL" as Role,
    branchId: "",
    managerId: "",
  });
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [plans, setPlans] = useState<BusinessPlan[]>([]);
  const [applications, setApplications] = useState<BusinessApplication[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [planDrafts, setPlanDrafts] = useState<BusinessPlan[]>([]);
  const [userEdits, setUserEdits] = useState<Record<string, { username: string; password: string }>>({});
  const [showPlanDetails, setShowPlanDetails] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<"MONTHLY" | "ANNUAL" | "FREE">("MONTHLY");
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardForm, setCardForm] = useState({
    label: "",
    holderName: "",
    cardNumber: "",
    expMonth: "",
    expYear: "",
    cvc: "",
  });

  const isSystemAdmin = user?.role === "YONETIM";
  const canManage = user?.role === "ADMİN" || user?.role === "YONETIM";

  useEffect(() => {
    if (!user) return;
    let active = true;

    const loadCommon = async () => {
      const businessesRes = await fetch("/api/businesses", { cache: "no-store" });
      const plansRes = await fetch("/api/plans", { cache: "no-store" });
      if (businessesRes.ok && plansRes.ok) {
        const businessPayload = await businessesRes.json();
        const planPayload = await plansRes.json();
        if (active) {
          setBusinesses(businessPayload.items ?? []);
          setPlans(planPayload.items ?? []);
          setPlanDrafts(planPayload.items ?? []);
        }
      }
    };

    const loadSystemAdmin = async () => {
      const [usersRes, appsRes, salesRes] = await Promise.all([
        fetch("/api/users", { cache: "no-store" }),
        fetch("/api/applications", { cache: "no-store" }),
        fetch(withBusinessId("/api/sales", "all"), { cache: "no-store" }),
      ]);
      if (active) {
        const usersPayload = usersRes.ok ? await usersRes.json() : { items: [] };
        const appsPayload = appsRes.ok ? await appsRes.json() : { items: [] };
        const salesPayload = salesRes.ok ? await salesRes.json() : { items: [] };
        setUsers(usersPayload.items ?? []);
        setApplications(appsPayload.items ?? []);
        setSales(salesPayload.items ?? []);
      }
    };

    const loadBusinessAdmin = async () => {
      getDemoUsers(businessId).then((list) => {
        if (active) setUsers(list);
      });
      fetch(withBusinessId("/api/branches", businessId), { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : { items: [] }))
        .then((data) => {
          if (active) setBranches(data.items ?? []);
        });
    };

    loadCommon();
    if (isSystemAdmin) {
      loadSystemAdmin();
    } else if (user.role === "ADMİN") {
      loadBusinessAdmin();
    }

    return () => {
      active = false;
    };
  }, [user, businessId, isSystemAdmin]);

  useEffect(() => {
    if (branches.length > 0 && !form.branchId && form.role !== "ADMİN") {
      setForm((prev) => ({ ...prev, branchId: branches[0].id }));
    }
  }, [branches, form.branchId, form.role]);

  useEffect(() => {
    if (!user || !businesses.length) return;
    const current = businesses.find((b) => b.id === user.businessId);
    if (!current) return;
    setSelectedPlanId(current.planId);
    setSelectedCycle(current.billingCycle === "FREE" ? "FREE" : current.billingCycle);
  }, [businesses, user]);

  const managers = useMemo(() => users.filter((u) => u.role === "MÜDÜR"), [users]);
  const currentBusiness = businesses.find((b) => b.id === user?.businessId);
  const currentPlan = plans.find((plan) => plan.id === currentBusiness?.planId);
  const paymentMethods = currentBusiness?.paymentMethods ?? [];

  const revenueSummary = useMemo(() => {
    const now = Date.now();
    return periodDays.map(({ label, days }) => {
      const cutoff = now - days * 24 * 60 * 60 * 1000;
      const periodSales = sales.filter((sale) => new Date(sale.createdAt).getTime() >= cutoff);
      const revenue = periodSales.reduce((sum, sale) => sum + sale.totalRevenue, 0);
      const profit = periodSales.reduce((sum, sale) => sum + sale.netProfit, 0);
      return { label, revenue, profit };
    });
  }, [sales]);

  if (!canManage) {
    return <div className="text-sm text-zinc-500">Bu sayfa sadece admin kullanıcılar içindir.</div>;
  }

  if (isSystemAdmin) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-semibold">Yönetim Paneli</h1>
          <p className="text-sm text-zinc-500">Tüm işletmeler, başvurular ve plan yönetimi.</p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {revenueSummary.map((summary) => (
            <div key={summary.label} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-400">{summary.label}</div>
              <div className="mt-2 text-lg font-semibold">{fmtTRY(summary.revenue)}</div>
              <div className="text-xs text-emerald-600">Net kâr {fmtTRY(summary.profit)}</div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          <div>
            <div className="font-medium">İşletmeler</div>
            <p className="text-xs text-zinc-500">Plan durumu, hesaplar ve ödeme bilgileri.</p>
          </div>
          <div className="grid gap-3">
            {businesses.map((biz) => {
              const plan = plans.find((p) => p.id === biz.planId);
              const bizUsers = users.filter((u) => u.businessId === biz.id);
              return (
                <div key={biz.id} className="rounded-2xl border bg-zinc-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold">{biz.name}</div>
                      <div className="text-xs text-zinc-500">
                        {plan?.name ?? "Plan yok"} • {biz.billingCycle === "FREE" ? "Ücretsiz" : "Ücretli"}
                      </div>
                      {biz.billingCycle !== "FREE" && plan && (
                        <div className="text-xs text-zinc-500">
                          Aylık ödeme: {fmtTRY(plan.monthlyPrice)} • Yıllık: {fmtTRY(plan.annualPrice)}
                        </div>
                      )}
                      <div className="text-xs text-zinc-500">
                        Ödeme yöntemi: {biz.paymentMethods?.[0]?.label ?? "-"}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-red-600"
                      onClick={async () => {
                        if (!confirm(`${biz.name} işletmesi silinsin mi?`)) return;
                        await fetch(`/api/businesses/${biz.id}`, { method: "DELETE" });
                        const refreshed = await fetch("/api/businesses", { cache: "no-store" }).then((r) =>
                          r.ok ? r.json() : { items: [] }
                        );
                        setBusinesses(refreshed.items ?? []);
                        const refreshedUsers = await fetch("/api/users", { cache: "no-store" }).then((r) =>
                          r.ok ? r.json() : { items: [] }
                        );
                        setUsers(refreshedUsers.items ?? []);
                      }}
                    >
                      İşletmeyi Sil
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-semibold text-zinc-600">Hesaplar</div>
                    {bizUsers.map((bizUser) => {
                      const edit = userEdits[bizUser.id] ?? {
                        username: bizUser.username,
                        password: "",
                      };
                      return (
                        <div key={bizUser.id} className="rounded-xl border bg-white p-3 text-xs">
                          <div className="flex flex-wrap items-center gap-2 justify-between">
                            <div>
                              <div className="font-medium">{bizUser.name}</div>
                              <div className="text-[11px] text-zinc-500">@{bizUser.username}</div>
                              <div className="text-[11px] text-zinc-500">Rol: {roleLabel(bizUser.role)}</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                className="rounded-lg border px-2 py-1 text-[11px]"
                                value={edit.username}
                                onChange={(event) =>
                                  setUserEdits((prev) => ({
                                    ...prev,
                                    [bizUser.id]: { ...edit, username: event.target.value },
                                  }))
                                }
                                placeholder="Kullanıcı adı"
                              />
                              <input
                                className="rounded-lg border px-2 py-1 text-[11px]"
                                value={edit.password}
                                onChange={(event) =>
                                  setUserEdits((prev) => ({
                                    ...prev,
                                    [bizUser.id]: { ...edit, password: event.target.value },
                                  }))
                                }
                                placeholder="Yeni şifre"
                                type="password"
                              />
                              <button
                                type="button"
                                className="rounded-lg bg-zinc-900 px-3 py-1 text-[11px] text-white"
                                onClick={async () => {
                                  await fetch(`/api/users/${bizUser.id}/credentials`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      username: edit.username,
                                      ...(edit.password ? { password: edit.password } : {}),
                                    }),
                                  });
                                  const refreshed = await fetch("/api/users", { cache: "no-store" }).then((r) =>
                                    r.ok ? r.json() : { items: [] }
                                  );
                                  setUsers(refreshed.items ?? []);
                                  setUserEdits((prev) => ({
                                    ...prev,
                                    [bizUser.id]: { username: edit.username, password: "" },
                                  }));
                                }}
                              >
                                Kaydet
                              </button>
                              <button
                                type="button"
                                className="text-[11px] text-red-600"
                                onClick={async () => {
                                  const next = users.filter((u) => u.id !== bizUser.id);
                                  await saveDemoUsers(next);
                                  setUsers(next);
                                }}
                              >
                                Sil
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {!bizUsers.length && <div className="text-xs text-zinc-500">Hesap bulunamadı.</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          <div>
            <div className="font-medium">Yeni Başvurular</div>
            <p className="text-xs text-zinc-500">Onay / red işlemleri.</p>
          </div>
          <div className="space-y-2 text-sm">
            {applications.map((app) => (
              <div key={app.id} className="rounded-xl border bg-zinc-50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{app.businessName}</div>
                    <div className="text-xs text-zinc-500">@{app.username}</div>
                  </div>
                  <span className="text-xs text-zinc-500">{app.status}</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-emerald-600 text-white px-3 py-1 text-xs"
                    disabled={app.status !== "PENDING"}
                    onClick={async () => {
                      await fetch(`/api/applications/${app.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "APPROVED", createBusiness: true }),
                      });
                      const refreshed = await fetch("/api/applications", { cache: "no-store" }).then((r) =>
                        r.ok ? r.json() : { items: [] }
                      );
                      setApplications(refreshed.items ?? []);
                      const refreshedBusinesses = await fetch("/api/businesses", { cache: "no-store" }).then((r) =>
                        r.ok ? r.json() : { items: [] }
                      );
                      setBusinesses(refreshedBusinesses.items ?? []);
                      const refreshedUsers = await fetch("/api/users", { cache: "no-store" }).then((r) =>
                        r.ok ? r.json() : { items: [] }
                      );
                      setUsers(refreshedUsers.items ?? []);
                    }}
                  >
                    Onayla
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border px-3 py-1 text-xs"
                    disabled={app.status !== "PENDING"}
                    onClick={async () => {
                      await fetch(`/api/applications/${app.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "REJECTED" }),
                      });
                      const refreshed = await fetch("/api/applications", { cache: "no-store" }).then((r) =>
                        r.ok ? r.json() : { items: [] }
                      );
                      setApplications(refreshed.items ?? []);
                    }}
                  >
                    Reddet
                  </button>
                </div>
              </div>
            ))}
            {!applications.length && <div className="text-xs text-zinc-500">Yeni başvuru yok.</div>}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          <div>
            <div className="font-medium">Plan Yönetimi</div>
            <p className="text-xs text-zinc-500">Fiyat ve içerik düzenlemeleri.</p>
          </div>
          <div className="space-y-3">
            {planDrafts.map((plan, index) => (
              <div key={plan.id} className="rounded-xl border bg-zinc-50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{plan.name}</div>
                  <span className="text-xs text-zinc-500">{plan.id}</span>
                </div>
                <div className="grid gap-2 md:grid-cols-4 text-xs">
                  <input
                    className="rounded-lg border px-2 py-1"
                    value={plan.monthlyPrice}
                    onChange={(event) => {
                      const next = [...planDrafts];
                      next[index] = { ...plan, monthlyPrice: Number(event.target.value) };
                      setPlanDrafts(next);
                    }}
                    type="number"
                    placeholder="Aylık"
                  />
                  <input
                    className="rounded-lg border px-2 py-1"
                    value={plan.annualPrice}
                    onChange={(event) => {
                      const next = [...planDrafts];
                      next[index] = { ...plan, annualPrice: Number(event.target.value) };
                      setPlanDrafts(next);
                    }}
                    type="number"
                    placeholder="Yıllık"
                  />
                  <input
                    className="rounded-lg border px-2 py-1"
                    value={plan.maxEmployees}
                    onChange={(event) => {
                      const next = [...planDrafts];
                      next[index] = { ...plan, maxEmployees: Number(event.target.value) };
                      setPlanDrafts(next);
                    }}
                    type="number"
                    placeholder="Çalışan"
                  />
                  <input
                    className="rounded-lg border px-2 py-1"
                    value={plan.maxBranches}
                    onChange={(event) => {
                      const next = [...planDrafts];
                      next[index] = { ...plan, maxBranches: Number(event.target.value) };
                      setPlanDrafts(next);
                    }}
                    type="number"
                    placeholder="Şube"
                  />
                </div>
                <textarea
                  className="w-full rounded-lg border px-2 py-1 text-xs"
                  rows={3}
                  value={plan.features.map((f) => f.label).join("\n")}
                  onChange={(event) => {
                    const next = [...planDrafts];
                    next[index] = {
                      ...plan,
                      features: event.target.value
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((label) => ({ label })),
                    };
                    setPlanDrafts(next);
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm"
              onClick={async () => {
                const r = await fetch("/api/plans", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ plans: planDrafts }),
                });
                if (!r.ok) return;
                const res = await r.json();
                setPlans(res.items ?? []);
                setPlanDrafts(res.items ?? []);
              }}
            >
              Planları Kaydet
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role !== "ADMİN") {
    return <div className="text-sm text-zinc-500">Bu sayfa sadece admin kullanıcılar içindir.</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Admin Paneli</h1>
        <p className="text-sm text-zinc-500">Yetkilendirme, denetim ve üst düzey ayarlar burada yönetilir.</p>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div>
          <div className="font-medium">Plan Yönetimi</div>
          <p className="text-xs text-zinc-500">Kendi işletme planınızı görüntüleyin veya değiştirin.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowPlanDetails((prev) => !prev)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          {showPlanDetails ? "Plan Detayını Gizle" : "Planı Görüntüle"}
        </button>
        {showPlanDetails && currentBusiness && (
          <div className="space-y-3">
            <div className="text-sm text-zinc-600">
              Aktif plan: <strong>{currentPlan?.name ?? "-"}</strong>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              {plans.map((plan) => (
                <label
                  key={plan.id}
                  className="rounded-xl border bg-zinc-50 p-3 text-xs cursor-pointer flex flex-col gap-1"
                >
                  <input
                    type="radio"
                    name="plan"
                    checked={selectedPlanId === plan.id}
                    onChange={() => {
                      setSelectedPlanId(plan.id);
                      setSelectedCycle(plan.monthlyPrice === 0 ? "FREE" : "MONTHLY");
                    }}
                  />
                  <span className="font-medium">{plan.name}</span>
                  <span className="text-zinc-500">Aylık: {fmtTRY(plan.monthlyPrice)}</span>
                  <span className="text-zinc-500">Yıllık: {fmtTRY(plan.annualPrice)}</span>
                  <span className="text-zinc-500">
                    {plan.maxEmployees} çalışan / {plan.maxBranches} şube
                  </span>
                </label>
              ))}
            </div>
            {selectedPlanId && selectedPlanId !== "plan-free" && (
              <div className="rounded-xl border bg-zinc-50 p-3 text-xs space-y-2">
                <div className="font-medium">Ödeme yöntemi</div>
                <div className="text-zinc-500">Ödeme yöntemi girme ekranı yakında tamamlanacaktır.</div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-1 ${selectedCycle === "MONTHLY" ? "bg-zinc-900 text-white" : ""}`}
                    onClick={() => setSelectedCycle("MONTHLY")}
                  >
                    Aylık
                  </button>
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-1 ${selectedCycle === "ANNUAL" ? "bg-zinc-900 text-white" : ""}`}
                    onClick={() => setSelectedCycle("ANNUAL")}
                  >
                    Yıllık (%20 indirim)
                  </button>
                </div>
              </div>
            )}
            <button
              type="button"
              className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm"
              onClick={async () => {
                if (!selectedPlanId) return;
                await fetch(`/api/businesses/${currentBusiness.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    planId: selectedPlanId,
                    billingCycle: selectedPlanId === "plan-free" ? "FREE" : selectedCycle,
                  }),
                });
                const refreshed = await fetch("/api/businesses", { cache: "no-store" }).then((r) =>
                  r.ok ? r.json() : { items: [] }
                );
                setBusinesses(refreshed.items ?? []);
              }}
            >
              Planı Güncelle
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div>
          <div className="font-medium">Ödeme Yöntemleri</div>
          <p className="text-xs text-zinc-500">Kart bilgisi veya tahsilat yöntemi.</p>
        </div>
        <div className="space-y-2">
          {paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between rounded-xl border bg-slate-50 px-3 py-2 text-xs">
              <div>
                <div className="font-medium">{method.label}</div>
                <div className="text-[11px] text-slate-500">
                  {method.holderName} • {method.cardNumber} • {method.expMonth}/{method.expYear}
                </div>
                <div className="text-[11px] text-slate-400">CVC: {method.cvc}</div>
              </div>
              <button
                type="button"
                className="rounded-lg border px-2 py-1"
                onClick={() => {
                  setEditingCardId(method.id);
                  setCardForm({
                    label: method.label,
                    holderName: method.holderName,
                    cardNumber: method.cardNumber,
                    expMonth: method.expMonth,
                    expYear: method.expYear,
                    cvc: method.cvc,
                  });
                  setShowCardForm(true);
                }}
                aria-label="Kartı düzenle"
                title="Kartı düzenle"
              >
                ✏️
              </button>
            </div>
          ))}
          {!paymentMethods.length && <div className="text-xs text-zinc-500">Henüz ödeme yöntemi yok.</div>}
        </div>
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm"
          onClick={() => {
            setEditingCardId(null);
            setCardForm({ label: "", holderName: "", cardNumber: "", expMonth: "", expYear: "", cvc: "" });
            setShowCardForm(true);
          }}
        >
          Ödeme Yöntemi Ekle
        </button>
        {showCardForm && (
          <div className="rounded-xl border bg-white p-3 text-xs space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="rounded-lg border px-2 py-1"
                placeholder="Kart adı"
                value={cardForm.label}
                onChange={(event) => setCardForm({ ...cardForm, label: event.target.value })}
              />
              <input
                className="rounded-lg border px-2 py-1"
                placeholder="Kart sahibi adı soyadı"
                value={cardForm.holderName}
                onChange={(event) => setCardForm({ ...cardForm, holderName: event.target.value })}
              />
              <input
                className="rounded-lg border px-2 py-1"
                placeholder="Kart no"
                value={cardForm.cardNumber}
                onChange={(event) => setCardForm({ ...cardForm, cardNumber: event.target.value })}
              />
              <input
                className="rounded-lg border px-2 py-1"
                placeholder="CVC"
                value={cardForm.cvc}
                onChange={(event) => setCardForm({ ...cardForm, cvc: event.target.value })}
              />
              <input
                className="rounded-lg border px-2 py-1"
                placeholder="Son kullanım ay"
                value={cardForm.expMonth}
                onChange={(event) => setCardForm({ ...cardForm, expMonth: event.target.value })}
              />
              <input
                className="rounded-lg border px-2 py-1"
                placeholder="Son kullanım yıl"
                value={cardForm.expYear}
                onChange={(event) => setCardForm({ ...cardForm, expYear: event.target.value })}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-lg bg-zinc-900 text-white px-3 py-1"
                onClick={async () => {
                  if (!currentBusiness) return;
                  if (!cardForm.label.trim()) return;
                  const updated = editingCardId
                    ? paymentMethods.map((method) =>
                        method.id === editingCardId ? { ...method, ...cardForm } : method
                      )
                    : [
                        ...paymentMethods,
                        { id: `pm-${Date.now()}`, ...cardForm },
                      ];
                  await fetch(`/api/businesses/${currentBusiness.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentMethods: updated }),
                  });
                  const refreshed = await fetch("/api/businesses", { cache: "no-store" }).then((r) =>
                    r.ok ? r.json() : { items: [] }
                  );
                  setBusinesses(refreshed.items ?? []);
                  setShowCardForm(false);
                  setEditingCardId(null);
                }}
              >
                Kaydet
              </button>
              {editingCardId && (
                <button
                  type="button"
                  className="rounded-lg border px-3 py-1 text-rose-600"
                  onClick={async () => {
                    if (!currentBusiness) return;
                    const updated = paymentMethods.filter((method) => method.id !== editingCardId);
                    await fetch(`/api/businesses/${currentBusiness.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ paymentMethods: updated }),
                    });
                    const refreshed = await fetch("/api/businesses", { cache: "no-store" }).then((r) =>
                      r.ok ? r.json() : { items: [] }
                    );
                    setBusinesses(refreshed.items ?? []);
                    setShowCardForm(false);
                    setEditingCardId(null);
                  }}
                >
                  Kartı Sil
                </button>
              )}
              <button
                type="button"
                className="rounded-lg border px-3 py-1"
                onClick={() => {
                  setShowCardForm(false);
                  setEditingCardId(null);
                }}
              >
                İptal
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div>
          <div className="font-medium">Kullanıcı & Yetkilendirme</div>
          <p className="text-xs text-zinc-500">Admin dışındaki kullanıcılar yetki yönetimini göremez veya düzenleyemez.</p>
        </div>
        <div className="grid gap-2 md:grid-cols-[1.4fr_1fr_0.6fr_0.8fr_0.8fr_auto]">
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Ad Soyad"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <input
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Kullanıcı adı"
            value={form.username}
            onChange={(event) => setForm({ ...form, username: event.target.value })}
          />
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.role}
            onChange={(event) => setForm({ ...form, role: event.target.value as Role })}
          >
            <option value="ADMİN">Admin</option>
            <option value="MÜDÜR">Müdür</option>
            <option value="PERSONEL">Personel</option>
          </select>
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.branchId}
            onChange={(event) => setForm({ ...form, branchId: event.target.value })}
            disabled={form.role === "ADMİN"}
          >
            <option value="">{form.role === "ADMİN" ? "Bayi yok" : "Bayi seçin"}</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border px-3 py-2 text-sm"
            value={form.managerId}
            onChange={(event) => setForm({ ...form, managerId: event.target.value })}
            disabled={form.role !== "PERSONEL"}
          >
            <option value="">Müdür seçin</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm"
            onClick={async () => {
              if (!form.name.trim() || !form.username.trim()) return;
              if (form.role !== "ADMİN" && !form.branchId) return;
              const created: DemoUser = {
                id: `demo-${Date.now()}`,
                businessId: user?.businessId ?? null,
                businessName: user?.businessName ?? null,
                username: form.username.trim(),
                password: "1234",
                name: form.name.trim(),
                role: form.role,
                landingPath: form.role === "PERSONEL" ? "/sales/quick" : "/dashboard",
                branchId: form.role === "ADMİN" ? null : form.branchId,
                managerId: form.role === "PERSONEL" ? form.managerId || null : null,
              };
              const next = [created, ...users];
              const saved = await saveDemoUsers(next);
              setUsers(saved);
              setForm({ name: "", username: "", role: "PERSONEL", branchId: "", managerId: "" });
            }}
          >
            Yetkili Ekle
          </button>
        </div>

        <div className="space-y-2">
          {users.map((demo) => (
            <div key={demo.id} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{demo.name}</div>
                <div className="text-xs text-zinc-500">@{demo.username}</div>
                {demo.role !== "ADMİN" && (
                  <div className="text-xs text-zinc-500">{branchLabel(branches, demo.branchId)}</div>
                )}
                {demo.role === "PERSONEL" && demo.managerId && (
                  <div className="text-[11px] text-zinc-400">
                    Müdür: {users.find((u) => u.id === demo.managerId)?.name ?? "-"}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={demo.role}
                  onChange={async (event) => {
                    const nextRole = event.target.value as Role;
                    const next = users.map((u) =>
                      u.id === demo.id
                        ? {
                            ...u,
                            role: nextRole,
                            landingPath: nextRole === "PERSONEL" ? "/sales/quick" : "/dashboard",
                            branchId: nextRole === "ADMİN" ? null : u.branchId ?? branches[0]?.id ?? null,
                            managerId: nextRole === "PERSONEL" ? u.managerId ?? null : null,
                          }
                        : u
                    );
                    const saved = await saveDemoUsers(next);
                    setUsers(saved);
                  }}
                  className="rounded-lg border px-2 py-1 text-xs"
                  disabled={demo.id === "user-admin"}
                >
                  <option value="ADMİN">Admin</option>
                  <option value="MÜDÜR">Müdür</option>
                  <option value="PERSONEL">Personel</option>
                </select>
                {demo.role !== "ADMİN" && (
                  <select
                    value={demo.branchId ?? ""}
                    onChange={async (event) => {
                      const nextBranch = event.target.value;
                      const next = users.map((u) =>
                        u.id === demo.id
                          ? {
                              ...u,
                              branchId: nextBranch || null,
                            }
                          : u
                      );
                      const saved = await saveDemoUsers(next);
                      setUsers(saved);
                    }}
                    className="rounded-lg border px-2 py-1 text-xs"
                    disabled={demo.id === "user-admin"}
                  >
                    <option value="">Bayi seç</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                )}
                {demo.role === "PERSONEL" && (
                  <select
                    value={demo.managerId ?? ""}
                    onChange={async (event) => {
                      const nextManagerId = event.target.value;
                      const next = users.map((u) =>
                        u.id === demo.id
                          ? {
                              ...u,
                              managerId: nextManagerId || null,
                            }
                          : u
                      );
                      const saved = await saveDemoUsers(next);
                      setUsers(saved);
                    }}
                    className="rounded-lg border px-2 py-1 text-xs"
                  >
                    <option value="">Müdür seç</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                )}
                <span className="text-xs rounded-full bg-zinc-100 px-2 py-1">{roleLabel(demo.role)}</span>
                {demo.id !== "user-admin" && (
                  <button
                    type="button"
                    onClick={async () => {
                      const next = users.filter((u) => u.id !== demo.id);
                      const saved = await saveDemoUsers(next);
                      setUsers(saved);
                    }}
                    className="text-xs text-red-600 hover:text-red-700"
                  >
                    Yetkiyi Kaldır
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
        <div>
          <div className="font-medium">Bayi Yönetimi</div>
          <p className="text-xs text-zinc-500">Birden fazla bayi ekleyebilir, müdür ve personelleri bağlayabilirsiniz.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            className="rounded-lg border px-3 py-2 text-sm flex-1"
            placeholder="Bayi adı"
            value={branchName}
            onChange={(event) => setBranchName(event.target.value)}
          />
          <button
            type="button"
            className="rounded-lg bg-zinc-900 text-white px-4 py-2 text-sm"
            onClick={async () => {
              const name = branchName.trim();
              if (!name) return;
              const res = await fetch(withBusinessId("/api/branches", businessId), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
              });
              if (!res.ok) return;
              const data = await res.json();
              setBranches((prev) => [data.item, ...prev]);
              setBranchName("");
            }}
          >
            Bayi Ekle
          </button>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {branches.map((branch) => (
            <div key={branch.id} className="rounded-xl border px-3 py-2 text-sm">
              <div className="font-medium">{branch.name}</div>
              <div className="text-xs text-zinc-500">{new Date(branch.createdAt).toLocaleDateString("tr-TR")}</div>
            </div>
          ))}
          {!branches.length && <div className="text-sm text-zinc-500">Henüz bayi yok.</div>}
        </div>
      </div>
    </div>
  );
}
