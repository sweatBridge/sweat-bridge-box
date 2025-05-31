import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'screens/admin/class/class_reservation_screen.dart';

final router = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/admin/class/reservation',
      builder: (context, state) => const ClassReservationScreen(),
    ),
  ],
); 