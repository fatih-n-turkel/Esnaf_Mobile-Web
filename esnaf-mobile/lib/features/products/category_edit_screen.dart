import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/models/models.dart';
import '../../data/repositories/products_repo.dart';

class CategoryEditScreen extends ConsumerStatefulWidget {
  const CategoryEditScreen({super.key});

  @override
  ConsumerState<CategoryEditScreen> createState() => _CategoryEditScreenState();
}

class _CategoryEditScreenState extends ConsumerState<CategoryEditScreen> {
  final TextEditingController _newCategoryController = TextEditingController();
  final Set<String> _newCategoryProducts = {};
  final List<_CategoryEdit> _edits = [];

  @override
  void initState() {
    super.initState();
    final repo = ref.read(productsRepoProvider);
    final products = repo.list();
    final categories = repo.categories();
    for (final name in categories) {
      _edits.add(
        _CategoryEdit(
          originalName: name,
          name: name,
          productIds: products.where((p) => p.category == name).map((p) => p.id).toSet(),
        ),
      );
    }
  }

  @override
  void dispose() {
    _newCategoryController.dispose();
    for (final edit in _edits) {
      edit.controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final repo = ref.watch(productsRepoProvider);
    final products = repo.list();

    return Scaffold(
      appBar: AppBar(title: const Text('Kategorileri Düzenle')),
      body: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Yeni Kategori', style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _newCategoryController,
                    decoration: const InputDecoration(labelText: 'Kategori adı'),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: products.map((product) {
                      final selected = _newCategoryProducts.contains(product.id);
                      return FilterChip(
                        label: Text(product.name),
                        selected: selected,
                        onSelected: (value) {
                          setState(() {
                            if (value) {
                              _newCategoryProducts.add(product.id);
                            } else {
                              _newCategoryProducts.remove(product.id);
                            }
                          });
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () async {
                      final name = _newCategoryController.text.trim();
                      if (name.isEmpty) return;
                      await repo.setCategoryAssignments(name, _newCategoryProducts);
                      setState(() {
                        _edits.add(
                          _CategoryEdit(
                            originalName: name,
                            name: name,
                            productIds: {..._newCategoryProducts},
                          ),
                        );
                        _newCategoryController.clear();
                        _newCategoryProducts.clear();
                      });
                    },
                    child: const Text('Kategori Ekle'),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          if (_edits.isEmpty) const Text('Kategori yok.', style: TextStyle(color: Colors.black54)),
          ..._edits.map((edit) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: edit.controller,
                              decoration: const InputDecoration(labelText: 'Kategori adı'),
                              onChanged: (v) => edit.name = v,
                            ),
                          ),
                          const SizedBox(width: 8),
                          FilledButton(
                            onPressed: () async {
                              final nextName = edit.name.trim();
                              if (nextName.isEmpty) return;
                              if (nextName != edit.originalName) {
                                await repo.renameCategory(edit.originalName, nextName);
                                edit.originalName = nextName;
                              }
                              await repo.setCategoryAssignments(nextName, edit.productIds);
                              setState(() {});
                            },
                            child: const Text('Kaydet'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: products.map((product) {
                          final selected = edit.productIds.contains(product.id);
                          return FilterChip(
                            label: Text(product.name),
                            selected: selected,
                            onSelected: (value) {
                              setState(() {
                                if (value) {
                                  edit.productIds.add(product.id);
                                } else {
                                  edit.productIds.remove(product.id);
                                }
                              });
                            },
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
              )),
        ],
      ),
    );
  }
}

class _CategoryEdit {
  _CategoryEdit({
    required this.originalName,
    required this.name,
    required Set<String> productIds,
  })  : productIds = productIds,
        controller = TextEditingController(text: name);

  String originalName;
  String name;
  final Set<String> productIds;
  final TextEditingController controller;
}
