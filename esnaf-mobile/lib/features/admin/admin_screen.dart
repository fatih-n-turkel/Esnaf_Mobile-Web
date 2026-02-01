import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/repositories/auth_repo.dart';
import '../../data/repositories/branches_repo.dart';
import '../../data/repositories/business_repo.dart';
import '../../data/repositories/plans_repo.dart';
import '../../data/repositories/applications_repo.dart';
import '../../data/repositories/sales_repo.dart';
import '../../data/models/models.dart';

class AdminScreen extends ConsumerStatefulWidget {
  const AdminScreen({super.key});

  @override
  ConsumerState<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends ConsumerState<AdminScreen> {
  final _nameController = TextEditingController();
  final _usernameController = TextEditingController();
  final _branchController = TextEditingController();
  String _role = 'staff';
  String _branchId = defaultBranchMainId;
  String _managerId = '';
  bool _showPlanDetails = false;
  String? _selectedPlanId;
  String _billingCycle = 'MONTHLY';
  bool _showCardForm = false;
  String? _editingCardId;
  final _cardLabelController = TextEditingController();
  final _cardHolderController = TextEditingController();
  final _cardNumberController = TextEditingController();
  final _cardExpMonthController = TextEditingController();
  final _cardExpYearController = TextEditingController();
  final _cardCvcController = TextEditingController();

  @override
  void dispose() {
    _nameController.dispose();
    _usernameController.dispose();
    _branchController.dispose();
    _cardLabelController.dispose();
    _cardHolderController.dispose();
    _cardNumberController.dispose();
    _cardExpMonthController.dispose();
    _cardExpYearController.dispose();
    _cardCvcController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authRepoProvider);
    final role = auth.getRole();
    final businessId = auth.getBusinessId();
    final businessName = auth.getBusinessName();
    ref.watch(branchesSeedProvider);
    final branchRepo = ref.watch(branchesRepoProvider);
    final branches = branchRepo.list(businessId: businessId);
    final users = auth.listUsers();
    final managers = users.where((u) => u.role == 'manager' && u.businessId == businessId).toList();

    if (role == 'system') {
      return _SystemAdminView(users: users);
    }

    if (role != 'admin') {
      return const Center(child: Text('Bu sayfa sadece admin kullanıcılar içindir.'));
    }

    final businessRepo = ref.watch(businessRepoProvider);
    final plansRepo = ref.watch(plansRepoProvider);
    final business = businessRepo.getById(businessId);
    final plans = plansRepo.list();
    final paymentMethods = business?.paymentMethods ?? [];

    if (business != null) {
      _selectedPlanId ??= business.planId;
      _billingCycle = business.billingCycle;
    }

    return Padding(
      padding: const EdgeInsets.all(12),
      child: ListView(
        children: [
          const Text('Admin Paneli', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          Text('Yetkilendirme, denetim ve üst düzey ayarlar burada yönetilir.',
              style: const TextStyle(color: Colors.black54)),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Plan Yönetimi', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Text('İşletme: $businessName', style: const TextStyle(fontSize: 12, color: Colors.black54)),
                  const SizedBox(height: 8),
                  OutlinedButton(
                    onPressed: () => setState(() => _showPlanDetails = !_showPlanDetails),
                    child: Text(_showPlanDetails ? 'Plan Detayını Gizle' : 'Planı Görüntüle'),
                  ),
                  if (_showPlanDetails && business != null) ...[
                    const SizedBox(height: 8),
                    ...plans.map((plan) => RadioListTile<String>(
                          value: plan.id,
                          groupValue: _selectedPlanId,
                          onChanged: (value) => setState(() {
                            _selectedPlanId = value;
                            if (plan.monthlyPrice == 0) {
                              _billingCycle = 'FREE';
                            }
                          }),
                          title: Text('${plan.name} • Aylık ₺${plan.monthlyPrice.toStringAsFixed(0)}'),
                          subtitle: Text('Yıllık ₺${plan.annualPrice.toStringAsFixed(0)} • ${plan.maxEmployees} çalışan / ${plan.maxBranches} şube'),
                        )),
                    if ((_selectedPlanId ?? '') != 'plan-free') ...[
                      const SizedBox(height: 8),
                      const Text('Ödeme yöntemi girme ekranı yakında tamamlanacaktır.',
                          style: TextStyle(fontSize: 12, color: Colors.black54)),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 8,
                        children: [
                          ChoiceChip(
                            label: const Text('Aylık'),
                            selected: _billingCycle == 'MONTHLY',
                            onSelected: (_) => setState(() => _billingCycle = 'MONTHLY'),
                          ),
                          ChoiceChip(
                            label: const Text('Yıllık (%20 indirim)'),
                            selected: _billingCycle == 'ANNUAL',
                            onSelected: (_) => setState(() => _billingCycle = 'ANNUAL'),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 8),
                    FilledButton(
                      onPressed: () async {
                        if (business == null || _selectedPlanId == null) return;
                        await businessRepo.upsert(
                          Business(
                            id: business.id,
                            name: business.name,
                            planId: _selectedPlanId!,
                            billingCycle: _selectedPlanId == 'plan-free' ? 'FREE' : _billingCycle,
                            createdAt: business.createdAt,
                            paymentMethods: business.paymentMethods,
                          ),
                        );
                        setState(() {});
                      },
                      child: const Text('Planı Güncelle'),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Ödeme Yöntemleri', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  if (paymentMethods.isEmpty)
                    const Text('Henüz ödeme yöntemi yok.', style: TextStyle(color: Colors.black54)),
                  ...paymentMethods.map((method) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(method.label),
                        subtitle: Text(
                          '${method.holderName} • ${method.cardNumber} • ${method.expMonth}/${method.expYear} • CVC ${method.cvc}',
                        ),
                        trailing: IconButton(
                          icon: const Icon(Icons.edit),
                        onPressed: () {
                          setState(() {
                            _editingCardId = method.id;
                            _cardLabelController.text = method.label;
                            _cardHolderController.text = method.holderName;
                            _cardNumberController.text = method.cardNumber;
                            _cardExpMonthController.text = method.expMonth;
                            _cardExpYearController.text = method.expYear;
                            _cardCvcController.text = method.cvc;
                            _showCardForm = true;
                          });
                        },
                        ),
                      )),
                  const SizedBox(height: 8),
                  OutlinedButton(
                    onPressed: () {
                      setState(() {
                        _editingCardId = null;
                        _cardLabelController.clear();
                        _cardHolderController.clear();
                        _cardNumberController.clear();
                        _cardExpMonthController.clear();
                        _cardExpYearController.clear();
                        _cardCvcController.clear();
                        _showCardForm = true;
                      });
                    },
                    child: const Text('Ödeme Yöntemi Ekle'),
                  ),
                  if (_showCardForm) ...[
                    const SizedBox(height: 8),
                    TextField(
                      decoration: const InputDecoration(labelText: 'Kart adı'),
                      controller: _cardLabelController,
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      decoration: const InputDecoration(labelText: 'Kart sahibi adı soyadı'),
                      controller: _cardHolderController,
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      decoration: const InputDecoration(labelText: 'Kart numarası'),
                      controller: _cardNumberController,
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      decoration: const InputDecoration(labelText: 'Son kullanım ay'),
                      controller: _cardExpMonthController,
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      decoration: const InputDecoration(labelText: 'Son kullanım yıl'),
                      controller: _cardExpYearController,
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      decoration: const InputDecoration(labelText: 'CVC'),
                      controller: _cardCvcController,
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: [
                        ElevatedButton(
                          onPressed: () async {
                            if (business == null) return;
                            final next = _editingCardId == null
                                ? [
                                    ...paymentMethods,
                                    PaymentMethod(
                                      id: newId(),
                                      label: _cardLabelController.text.trim(),
                                      holderName: _cardHolderController.text.trim(),
                                      cardNumber: _cardNumberController.text.trim(),
                                      expMonth: _cardExpMonthController.text.trim(),
                                      expYear: _cardExpYearController.text.trim(),
                                      cvc: _cardCvcController.text.trim(),
                                    ),
                                  ]
                                : paymentMethods
                                    .map(
                                      (method) => method.id == _editingCardId
                                          ? PaymentMethod(
                                              id: method.id,
                                              label: _cardLabelController.text.trim(),
                                              holderName: _cardHolderController.text.trim(),
                                              cardNumber: _cardNumberController.text.trim(),
                                              expMonth: _cardExpMonthController.text.trim(),
                                              expYear: _cardExpYearController.text.trim(),
                                              cvc: _cardCvcController.text.trim(),
                                            )
                                          : method,
                                    )
                                    .toList();
                            await businessRepo.upsert(
                              Business(
                                id: business.id,
                                name: business.name,
                                planId: business.planId,
                                billingCycle: business.billingCycle,
                                createdAt: business.createdAt,
                                paymentMethods: next,
                              ),
                            );
                            setState(() {
                              _showCardForm = false;
                              _editingCardId = null;
                            });
                          },
                          child: const Text('Kaydet'),
                        ),
                        if (_editingCardId != null)
                          TextButton(
                            onPressed: () async {
                              if (business == null) return;
                              final next = paymentMethods.where((m) => m.id != _editingCardId).toList();
                              await businessRepo.upsert(
                                Business(
                                  id: business.id,
                                  name: business.name,
                                  planId: business.planId,
                                  billingCycle: business.billingCycle,
                                  createdAt: business.createdAt,
                                  paymentMethods: next,
                                ),
                              );
                              setState(() {
                                _showCardForm = false;
                                _editingCardId = null;
                              });
                            },
                            child: const Text('Kartı Sil', style: TextStyle(color: Colors.red)),
                          ),
                        TextButton(
                          onPressed: () => setState(() {
                            _showCardForm = false;
                            _editingCardId = null;
                          }),
                          child: const Text('İptal'),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: ListTile(
              leading: const Icon(Icons.analytics_outlined),
              title: const Text('Müdür Analizi'),
              subtitle: const Text('Performans, stok ve satış analizleri görün.'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.go('/analysis'),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Bayi Yönetimi', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _branchController,
                    decoration: const InputDecoration(labelText: 'Bayi adı', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        final name = _branchController.text.trim();
                        if (name.isEmpty) return;
                        await branchRepo.addBranch(name, businessId: businessId);
                        setState(() => _branchController.clear());
                      },
                      child: const Text('Bayi Ekle'),
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (branches.isEmpty) const Text('Henüz bayi yok.', style: TextStyle(color: Colors.black54)),
                  ...branches.map((branch) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: Text(branch.name),
                        subtitle: Text('ID: ${branch.id}'),
                      )),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Kullanıcı & Yetkilendirme', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  const Text(
                    'Admin dışındaki kullanıcılar yetki yönetimini göremez veya düzenleyemez.',
                    style: TextStyle(fontSize: 12, color: Colors.black54),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(labelText: 'Ad Soyad', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _usernameController,
                    decoration: const InputDecoration(labelText: 'Kullanıcı adı', border: OutlineInputBorder()),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _role,
                    decoration: const InputDecoration(labelText: 'Rol', border: OutlineInputBorder()),
                    items: const [
                      DropdownMenuItem(value: 'admin', child: Text('Admin')),
                      DropdownMenuItem(value: 'manager', child: Text('Müdür')),
                      DropdownMenuItem(value: 'staff', child: Text('Personel')),
                    ],
                    onChanged: (value) => setState(() => _role = value ?? _role),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _role == 'admin'
                        ? ''
                        : (branches.any((branch) => branch.id == _branchId)
                            ? _branchId
                            : (branches.isNotEmpty ? branches.first.id : '')),
                    decoration: const InputDecoration(labelText: 'Bayi', border: OutlineInputBorder()),
                    items: [
                      const DropdownMenuItem(value: '', child: Text('Bayi yok')),
                      ...branches.map((branch) => DropdownMenuItem(value: branch.id, child: Text(branch.name))),
                    ],
                    onChanged: _role == 'admin' ? null : (value) => setState(() => _branchId = value ?? _branchId),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _role == 'staff' ? _managerId : '',
                    decoration: const InputDecoration(labelText: 'Müdür', border: OutlineInputBorder()),
                    items: [
                      const DropdownMenuItem(value: '', child: Text('Müdür seçin')),
                      ...managers.map((manager) => DropdownMenuItem(value: manager.username, child: Text(manager.name))),
                    ],
                    onChanged: _role == 'staff' ? (value) => setState(() => _managerId = value ?? '') : null,
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        final name = _nameController.text.trim();
                        final username = _usernameController.text.trim();
                        if (name.isEmpty || username.isEmpty) return;
                        auth.upsertUser(
                          name: name,
                          username: username,
                          role: _role,
                          password: '1234',
                          branchId: _role == 'admin' ? '' : _branchId,
                          managerId: _role == 'staff' ? _managerId : null,
                          businessId: businessId,
                          businessName: businessName,
                        );
                        setState(() {
                          _nameController.clear();
                          _usernameController.clear();
                          _role = 'staff';
                          _branchId = branches.isNotEmpty ? branches.first.id : defaultBranchMainId;
                          _managerId = '';
                        });
                      },
                      child: const Text('Yetkili Ekle'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  ...users
                      .where((u) => u.businessId == businessId)
                      .map(
                        (user) => ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(user.name),
                          subtitle: Text(
                            '@${user.username} • ${_branchLabel(branches, user.branchId)}'
                            '${user.role == 'staff' && user.managerId != null ? ' • Müdür: ${_managerLabel(users, user.managerId!)}' : ''}',
                          ),
                          trailing: Wrap(
                            spacing: 8,
                            children: [
                              DropdownButton<String>(
                                value: user.role,
                                onChanged: user.username == 'fatih'
                                    ? null
                                    : (value) {
                                        if (value == null) return;
                                        auth.updateUserRole(username: user.username, role: value);
                                      },
                                items: const [
                                  DropdownMenuItem(value: 'admin', child: Text('Admin')),
                                  DropdownMenuItem(value: 'manager', child: Text('Müdür')),
                                  DropdownMenuItem(value: 'staff', child: Text('Personel')),
                                ],
                              ),
                              Chip(label: Text(_roleLabel(user.role))),
                              if (user.role == 'staff')
                                DropdownButton<String>(
                                  value: user.managerId ?? '',
                                  onChanged: (value) => auth.upsertUser(
                                    name: user.name,
                                    username: user.username,
                                    role: user.role,
                                    branchId: user.branchId,
                                    managerId: value,
                                    businessId: user.businessId,
                                    businessName: user.businessName,
                                  ),
                                  items: [
                                    const DropdownMenuItem(value: '', child: Text('Müdür seçin')),
                                    ...managers
                                        .map((manager) => DropdownMenuItem(value: manager.username, child: Text(manager.name))),
                                  ],
                                ),
                              if (user.username != 'fatih')
                                TextButton(
                                  onPressed: () => auth.removeUser(user.username),
                                  child: const Text('Yetkiyi Kaldır', style: TextStyle(color: Colors.red)),
                                ),
                            ],
                          ),
                        ),
                      ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SystemAdminView extends ConsumerStatefulWidget {
  const _SystemAdminView({required this.users});
  final List<AuthUser> users;

  @override
  ConsumerState<_SystemAdminView> createState() => _SystemAdminViewState();
}

class _SystemAdminViewState extends ConsumerState<_SystemAdminView> {
  final _planDrafts = <BusinessPlan>[];
  final _userEdits = <String, TextEditingController>{};
  final _passEdits = <String, TextEditingController>{};

  @override
  void dispose() {
    for (final controller in _userEdits.values) {
      controller.dispose();
    }
    for (final controller in _passEdits.values) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final businessRepo = ref.watch(businessRepoProvider);
    final plansRepo = ref.watch(plansRepoProvider);
    final applicationsRepo = ref.watch(applicationsRepoProvider);
    final salesRepo = ref.watch(salesRepoProvider);
    final businesses = businessRepo.list();
    final plans = plansRepo.list();
    final applications = applicationsRepo.list();
    final sales = salesRepo.listRecent(limit: 500);

    if (_planDrafts.isEmpty) {
      _planDrafts.addAll(plans);
    }

    final now = DateTime.now();
    double sumForDays(int days) {
      return sales.where((sale) => now.difference(DateTime.fromMillisecondsSinceEpoch(sale.createdAt)).inDays <= days).fold(
          0.0, (sum, sale) => sum + sale.totalGross);
    }

    return Padding(
      padding: const EdgeInsets.all(12),
      child: ListView(
        children: [
          const Text('Yönetim Paneli', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          const Text('Tüm işletmeler, planlar ve başvurular burada yönetilir.', style: TextStyle(color: Colors.black54)),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _StatCard(title: 'Aylık Ciro', value: sumForDays(30)),
              _StatCard(title: 'Çeyreklik Ciro', value: sumForDays(90)),
              _StatCard(title: 'Yıllık Ciro', value: sumForDays(365)),
            ],
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('İşletmeler', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  ...businesses.map((biz) {
                    final plan = plans.firstWhere((p) => p.id == biz.planId, orElse: () => plans.first);
                    final bizUsers = widget.users.where((u) => u.businessId == biz.id).toList();
                    return Card(
                      color: Colors.grey.shade50,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(biz.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                                Text(plan.name, style: const TextStyle(fontSize: 12, color: Colors.black54)),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text('Plan: ${plan.name} • ${biz.billingCycle}', style: const TextStyle(fontSize: 12)),
                            Text('Aylık: ₺${plan.monthlyPrice.toStringAsFixed(0)} • Yıllık: ₺${plan.annualPrice.toStringAsFixed(0)}',
                                style: const TextStyle(fontSize: 12)),
                            Text(
                              'Ödeme yöntemi: ${biz.paymentMethods != null && biz.paymentMethods!.isNotEmpty ? biz.paymentMethods!.first.label : '-'}',
                              style: const TextStyle(fontSize: 12),
                            ),
                            const SizedBox(height: 8),
                            const Text('Hesaplar', style: TextStyle(fontWeight: FontWeight.w600)),
                            const SizedBox(height: 6),
                            ...bizUsers.map((user) {
                              _userEdits.putIfAbsent(user.id, () => TextEditingController(text: user.username));
                              _passEdits.putIfAbsent(user.id, () => TextEditingController());
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 6),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('${user.name} • ${user.role}', style: const TextStyle(fontSize: 12)),
                                    const SizedBox(height: 4),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: TextField(
                                            controller: _userEdits[user.id],
                                            decoration: const InputDecoration(labelText: 'Kullanıcı adı'),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: TextField(
                                            controller: _passEdits[user.id],
                                            decoration: const InputDecoration(labelText: 'Yeni şifre'),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        ElevatedButton(
                                          onPressed: () async {
                                            ref.read(authRepoProvider).upsertUser(
                                                  name: user.name,
                                                  username: _userEdits[user.id]!.text.trim(),
                                                  role: user.role,
                                                  branchId: user.branchId,
                                                  managerId: user.managerId,
                                                  password: _passEdits[user.id]!.text.isEmpty
                                                      ? user.password
                                                      : _passEdits[user.id]!.text,
                                                  businessId: user.businessId,
                                                  businessName: user.businessName,
                                                );
                                            _passEdits[user.id]!.clear();
                                            setState(() {});
                                          },
                                          child: const Text('Kaydet'),
                                        ),
                                        const SizedBox(width: 6),
                                        TextButton(
                                          onPressed: () => ref.read(authRepoProvider).removeUser(user.username),
                                          child: const Text('Sil', style: TextStyle(color: Colors.red)),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              );
                            }),
                            const SizedBox(height: 8),
                            TextButton(
                              onPressed: () async {
                                await businessRepo.remove(biz.id);
                                for (final user in bizUsers) {
                                  await ref.read(authRepoProvider).removeUser(user.username);
                                }
                                setState(() {});
                              },
                              child: const Text('İşletmeyi Sil', style: TextStyle(color: Colors.red)),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Yeni Başvurular', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  ...applications.map((app) => ListTile(
                        title: Text(app.businessName),
                        subtitle: Text('@${app.username} • ${app.status}'),
                        trailing: Wrap(
                          spacing: 6,
                          children: [
                            ElevatedButton(
                              onPressed: app.status == 'PENDING'
                                  ? () async {
                                      await applicationsRepo.updateStatus(app.id, 'APPROVED');
                                      final businessId = 'biz-${app.businessName.toLowerCase().replaceAll(' ', '-')}' ;
                                      await businessRepo.upsert(
                                        Business(
                                          id: businessId,
                                          name: app.businessName,
                                          planId: 'plan-free',
                                          billingCycle: 'FREE',
                                          createdAt: DateTime.now().millisecondsSinceEpoch,
                                        ),
                                      );
                                      ref.read(authRepoProvider).upsertUser(
                                            name: app.username,
                                            username: app.username,
                                            role: 'admin',
                                            password: app.password,
                                            branchId: '',
                                            businessId: businessId,
                                            businessName: app.businessName,
                                          );
                                      setState(() {});
                                    }
                                  : null,
                              child: const Text('Onayla'),
                            ),
                            TextButton(
                              onPressed: app.status == 'PENDING'
                                  ? () async {
                                      await applicationsRepo.updateStatus(app.id, 'REJECTED');
                                      setState(() {});
                                    }
                                  : null,
                              child: const Text('Reddet', style: TextStyle(color: Colors.red)),
                            ),
                          ],
                        ),
                      )),
                  if (applications.isEmpty) const Text('Başvuru yok.', style: TextStyle(color: Colors.black54)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Plan Yönetimi', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  ..._planDrafts.asMap().entries.map((entry) {
                    final i = entry.key;
                    final plan = entry.value;
                    return Card(
                      color: Colors.grey.shade50,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(plan.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    decoration: const InputDecoration(labelText: 'Aylık'),
                                    keyboardType: TextInputType.number,
                                    onChanged: (v) => _planDrafts[i] = plan.copyWith(monthlyPrice: double.tryParse(v) ?? 0),
                                    controller: TextEditingController(text: plan.monthlyPrice.toStringAsFixed(0)),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: TextField(
                                    decoration: const InputDecoration(labelText: 'Yıllık'),
                                    keyboardType: TextInputType.number,
                                    onChanged: (v) => _planDrafts[i] = plan.copyWith(annualPrice: double.tryParse(v) ?? 0),
                                    controller: TextEditingController(text: plan.annualPrice.toStringAsFixed(0)),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    decoration: const InputDecoration(labelText: 'Max çalışan'),
                                    keyboardType: TextInputType.number,
                                    onChanged: (v) => _planDrafts[i] = plan.copyWith(maxEmployees: int.tryParse(v) ?? 0),
                                    controller: TextEditingController(text: plan.maxEmployees.toString()),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: TextField(
                                    decoration: const InputDecoration(labelText: 'Max şube'),
                                    keyboardType: TextInputType.number,
                                    onChanged: (v) => _planDrafts[i] = plan.copyWith(maxBranches: int.tryParse(v) ?? 0),
                                    controller: TextEditingController(text: plan.maxBranches.toString()),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              decoration: const InputDecoration(labelText: 'Özellikler (satır satır)'),
                              maxLines: 3,
                              controller: TextEditingController(text: plan.features.join('\n')),
                              onChanged: (v) => _planDrafts[i] = plan.copyWith(features: v.split('\n').where((e) => e.trim().isNotEmpty).toList()),
                            ),
                          ],
                        ),
                      ),
                    );
                  }),
                  const SizedBox(height: 8),
                  ElevatedButton(
                    onPressed: () async {
                      await plansRepo.saveAll(_planDrafts);
                      setState(() {});
                    },
                    child: const Text('Planları Kaydet'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

String _roleLabel(String role) {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'manager':
      return 'Müdür';
    case 'staff':
      return 'Personel';
    default:
      return role;
  }
}

String _branchLabel(List<Branch> branches, String branchId) {
  if (branchId.isEmpty) return 'Bayi yok';
  final branch = branches.where((b) => b.id == branchId).toList();
  if (branch.isEmpty) return 'Bilinmeyen bayi';
  return branch.first.name;
}

String _managerLabel(List<AuthUser> users, String managerId) {
  final manager = users.where((u) => u.username == managerId || u.id == managerId).toList();
  if (manager.isEmpty) return 'Bilinmeyen müdür';
  return manager.first.name;
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.title, required this.value});
  final String title;
  final double value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 160,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 12, color: Colors.black54)),
              const SizedBox(height: 6),
              Text('₺${value.toStringAsFixed(2)}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }
}
