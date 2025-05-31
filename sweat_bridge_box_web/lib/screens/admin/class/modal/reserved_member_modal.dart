import 'package:flutter/material.dart';

class ReservedMemberModal extends StatelessWidget {
  final List<Map<String, String>> members;
  final VoidCallback onClose;

  const ReservedMemberModal({
    super.key,
    required this.members,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('예약 인원'),
      content: SizedBox(
        width: 300,
        child: DataTable(
          columns: const [
            DataColumn(label: Text('이름')),
            DataColumn(label: Text('닉네임')),
          ],
          rows: members.map((member) {
            return DataRow(
              cells: [
                DataCell(Text(member['realName'] ?? '')),
                DataCell(Text(member['nickName'] ?? '')),
              ],
            );
          }).toList(),
        ),
      ),
      actions: [
        TextButton(
          onPressed: onClose,
          child: const Text('닫기'),
        ),
      ],
    );
  }
} 