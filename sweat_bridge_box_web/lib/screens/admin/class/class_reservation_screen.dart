import 'package:flutter/material.dart';
import 'package:syncfusion_flutter_calendar/calendar.dart';
import 'package:intl/intl.dart';
// import 'package:cloud_firestore/cloud_firestore.dart';
// import '../../../services/firebase_service.dart';
import 'modal/manage_class_modal.dart';
import 'modal/reserved_member_modal.dart';

class ClassReservationScreen extends StatefulWidget {
  const ClassReservationScreen({super.key});

  @override
  State<ClassReservationScreen> createState() => _ClassReservationScreenState();
}

class _ClassReservationScreenState extends State<ClassReservationScreen> {
  late CalendarController _calendarController;
  List<Appointment> _appointments = [];
  CalendarView _currentView = CalendarView.month;
  DateTime? _selectedDate;

  @override
  void initState() {
    super.initState();
    _calendarController = CalendarController();
    _loadDummyClasses();
  }

  void _loadDummyClasses() {
    final now = DateTime.now();
    setState(() {
      _appointments = [
        Appointment(
          startTime: DateTime(now.year, now.month, now.day, 10, 0),
          endTime: DateTime(now.year, now.month, now.day, 11, 0),
          subject: '홍길동 (2/10)',
          color: Colors.blue,
        ),
        Appointment(
          startTime: DateTime(now.year, now.month, now.day, 14, 0),
          endTime: DateTime(now.year, now.month, now.day, 15, 0),
          subject: '김코치 (5/8)',
          color: Colors.green,
        ),
      ];
    });
  }

  void _addNewClass(String coachName, String capacity, DateTime startTime) {
    setState(() {
      _appointments.add(
        Appointment(
          startTime: startTime,
          endTime: startTime.add(const Duration(hours: 1)),
          subject: '$coachName (0/$capacity)',
          color: Colors.blue,
        ),
      );
    });
  }

  Future<DateTime?> _selectDate(BuildContext context, DateTime initialDate) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: DateTime(2024),
      lastDate: DateTime(2025),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: Theme.of(context).primaryColor,
              onPrimary: Colors.white,
              surface: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      final TimeOfDay? pickedTime = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(initialDate),
        builder: (context, child) {
          return Theme(
            data: Theme.of(context).copyWith(
              colorScheme: ColorScheme.light(
                primary: Theme.of(context).primaryColor,
                onPrimary: Colors.white,
                surface: Colors.white,
                onSurface: Colors.black,
              ),
            ),
            child: child!,
          );
        },
      );
      if (pickedTime != null) {
        return DateTime(
          picked.year,
          picked.month,
          picked.day,
          pickedTime.hour,
          pickedTime.minute,
        );
      }
    }
    return null;
  }

  void _showAddClassModal(DateTime selectedDate) {
    final coachController = TextEditingController();
    final capacityController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('새 수업 추가'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: coachController,
              decoration: const InputDecoration(
                labelText: '코치 이름',
                hintText: '코치 이름을 입력하세요',
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: capacityController,
              decoration: const InputDecoration(
                labelText: '정원',
                hintText: '수업 정원을 입력하세요',
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
            Text(
              '시작 시간: ${DateFormat('yyyy-MM-dd HH:mm').format(selectedDate)}',
              style: const TextStyle(fontSize: 14),
            ),
            Text(
              '종료 시간: ${DateFormat('yyyy-MM-dd HH:mm').format(selectedDate.add(const Duration(hours: 1)))}',
              style: const TextStyle(fontSize: 14),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('취소'),
          ),
          ElevatedButton(
            onPressed: () {
              if (coachController.text.isNotEmpty && capacityController.text.isNotEmpty) {
                _addNewClass(
                  coachController.text,
                  capacityController.text,
                  selectedDate,
                );
                Navigator.pop(context);
              }
            },
            child: const Text('추가'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('수업 예약'),
        actions: [
          TextButton.icon(
            icon: const Icon(Icons.calendar_month),
            label: const Text('월별'),
            onPressed: () {
              setState(() {
                _currentView = CalendarView.month;
              });
            },
          ),
          TextButton.icon(
            icon: const Icon(Icons.view_week),
            label: const Text('주별'),
            onPressed: () {
              setState(() {
                _currentView = CalendarView.week;
              });
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          if (_selectedDate != null) {
            _showAddClassModal(_selectedDate!);
          } else {
            _showAddClassModal(DateTime.now());
          }
        },
        child: const Icon(Icons.add),
      ),
      body: SfCalendar(
        view: _currentView,
        controller: _calendarController,
        dataSource: _AppointmentDataSource(_appointments),
        monthViewSettings: const MonthViewSettings(
          showAgenda: true,
        ),
        timeSlotViewSettings: const TimeSlotViewSettings(
          startHour: 0,
          endHour: 24,
        ),
        onTap: (details) {
          setState(() {
            _selectedDate = details.date;
          });
          if (details.targetElement == CalendarElement.viewHeader) {
            _showAddClassModal(details.date!);
          }
        },
      ),
    );
  }

  @override
  void dispose() {
    _calendarController.dispose();
    super.dispose();
  }
}

class _AppointmentDataSource extends CalendarDataSource {
  _AppointmentDataSource(List<Appointment> source) {
    appointments = source;
  }
} 