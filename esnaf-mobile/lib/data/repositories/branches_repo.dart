import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../local/hive_boxes.dart';
import '../models/models.dart';

const defaultBranchMainId = 'branch-main';
const defaultBranchCoastId = 'branch-coast';

class BranchesRepo {
  Future<void> ensureSeed() async {
    final box = HiveBoxes.box(HiveBoxes.branches);
    if (box.isNotEmpty) return;
    final now = DateTime.now().millisecondsSinceEpoch;
    final branches = [
      Branch(id: defaultBranchMainId, name: 'Merkez Şube', createdAt: now),
      Branch(id: defaultBranchCoastId, name: 'Sahil Şube', createdAt: now),
    ];
    for (final branch in branches) {
      await box.put(branch.id, branch.toMap());
    }
  }

  List<Branch> list() {
    final box = HiveBoxes.box(HiveBoxes.branches);
    final items = box.values.map((m) => Branch.fromMap(m)).toList();
    items.sort((a, b) => a.name.compareTo(b.name));
    return items;
  }

  Future<Branch?> addBranch(String name) async {
    final trimmed = name.trim();
    if (trimmed.isEmpty) return null;
    final box = HiveBoxes.box(HiveBoxes.branches);
    final created = Branch(id: newId(), name: trimmed, createdAt: DateTime.now().millisecondsSinceEpoch);
    await box.put(created.id, created.toMap());
    return created;
  }
}

final branchesRepoProvider = Provider<BranchesRepo>((ref) => BranchesRepo());
final branchesSeedProvider = FutureProvider<void>((ref) async {
  final repo = ref.watch(branchesRepoProvider);
  await repo.ensureSeed();
});
