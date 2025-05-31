import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../services/firebase_service.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  final _firestore = FirebaseService.firestore;
  List<Map<String, dynamic>> _members = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadMembers();
  }

  Future<void> _loadMembers() async {
    try {
      final snapshot = await _firestore.collection('members').get();
      setState(() {
        _members = snapshot.docs
            .map((doc) => {
                  'id': doc.id,
                  ...doc.data(),
                })
            .toList();
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('회원 목록을 불러오는데 실패했습니다.')),
        );
      }
    }
  }

  Future<void> _logout() async {
    try {
      await FirebaseAuth.instance.signOut();
      if (mounted) {
        context.go('/login');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('로그아웃에 실패했습니다.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Sweat Bridge Box'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16),
              child: DataTable(
                columns: const [
                  DataColumn(
                    label: Text('이름'),
                  ),
                  DataColumn(
                    label: Text('닉네임'),
                  ),
                  DataColumn(
                    label: Text('이메일'),
                  ),
                  DataColumn(
                    label: Text('전화번호'),
                  ),
                ],
                rows: _members.map((member) {
                  return DataRow(
                    cells: [
                      DataCell(Text(member['realName'] ?? '')),
                      DataCell(Text(member['nickName'] ?? '')),
                      DataCell(Text(member['email'] ?? '')),
                      DataCell(Text(member['phone'] ?? '')),
                    ],
                  );
                }).toList(),
              ),
            ),
    );
  }
} 