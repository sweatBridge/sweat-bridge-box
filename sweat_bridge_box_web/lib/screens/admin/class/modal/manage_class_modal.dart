import 'package:flutter/material.dart';

class ManageClassModal extends StatelessWidget {
  final String startStrKst;
  final String endStrKst;
  final TextEditingController coachController;
  final TextEditingController capacityController;
  final int reservedCount;
  final VoidCallback onShowMembers;
  final VoidCallback onDelete;
  final VoidCallback onUpdate;
  final VoidCallback onClose;

  const ManageClassModal({
    super.key,
    required this.startStrKst,
    required this.endStrKst,
    required this.coachController,
    required this.capacityController,
    required this.reservedCount,
    required this.onShowMembers,
    required this.onDelete,
    required this.onUpdate,
    required this.onClose,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('수업 관리'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _inputRow('시작 시각', startStrKst, readOnly: true),
          _inputRow('종료 시각', endStrKst, readOnly: true),
          _inputRow('코치', null, controller: coachController),
          Row(
            children: [
              Expanded(
                child: _inputRow('정원', null, controller: capacityController),
              ),
              const SizedBox(width: 8),
              const Text('예약'),
              const SizedBox(width: 8),
              SizedBox(
                width: 40,
                child: Text('$reservedCount', textAlign: TextAlign.center),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: onShowMembers,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black87,
                  foregroundColor: Colors.white,
                  shape: const StadiumBorder(),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                ),
                child: const Text('보기'),
              ),
            ],
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: onDelete,
          child: const Text('삭제', style: TextStyle(color: Colors.red)),
        ),
        TextButton(
          onPressed: onUpdate,
          child: const Text('변경', style: TextStyle(color: Colors.green)),
        ),
        TextButton(
          onPressed: onClose,
          child: const Text('닫기'),
        ),
      ],
    );
  }

  Widget _inputRow(String label, String? value, {TextEditingController? controller, bool readOnly = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          SizedBox(width: 80, child: Text(label)),
          Expanded(
            child: controller != null
                ? TextField(controller: controller)
                : Text(value ?? ''),
          ),
        ],
      ),
    );
  }
} 