import 'package:flutter/material.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final List<_ToggleOption> _active = [
    _ToggleOption('Kritik stok uyarıları', true),
    _ToggleOption('Gün sonu satış ve kâr özeti', true),
    _ToggleOption('Uzun süredir satılmayan ürün uyarıları', true),
  ];

  final List<_ToggleOption> _personal = [
    _ToggleOption('Sadece kritik uyarıları göster', false),
    _ToggleOption('Haftalık özet e-postası gönder', false),
    _ToggleOption('Kasiyer / personel bildirimlerini filtrele', false),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: ListView(
        children: [
          const Text('Bildirimler', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 4),
          const Text('Kritik stok, satış özeti ve ürün performans uyarıları.', style: TextStyle(color: Colors.black54)),
          const SizedBox(height: 16),
          _SectionCard(
            title: 'Aktif Bildirimler',
            children: _active
                .map((option) => CheckboxListTile(
                      value: option.enabled,
                      onChanged: (v) => setState(() => option.enabled = v ?? option.enabled),
                      title: Text(option.label),
                      controlAffinity: ListTileControlAffinity.leading,
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                    ))
                .toList(),
          ),
          const SizedBox(height: 12),
          _SectionCard(
            title: 'Kullanıcıya Özel Ayarlar',
            subtitle:
                'Bildirim sıklığı, kanal (uygulama içi/e-posta) ve rol bazlı filtreler kullanıcı tarafından özelleştirilebilir.',
            children: _personal
                .map((option) => CheckboxListTile(
                      value: option.enabled,
                      onChanged: (v) => setState(() => option.enabled = v ?? option.enabled),
                      title: Text(option.label),
                      controlAffinity: ListTileControlAffinity.leading,
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                    ))
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _ToggleOption {
  _ToggleOption(this.label, this.enabled);
  final String label;
  bool enabled;
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.title, required this.children, this.subtitle});
  final String title;
  final String? subtitle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
            if (subtitle != null) ...[
              const SizedBox(height: 4),
              Text(subtitle!, style: const TextStyle(fontSize: 12, color: Colors.black54)),
            ],
            const SizedBox(height: 8),
            ...children,
          ],
        ),
      ),
    );
  }
}
