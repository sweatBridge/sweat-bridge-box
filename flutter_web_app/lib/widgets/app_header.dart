import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class AppHeader extends StatelessWidget {
  const AppHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 80,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(
          bottom: BorderSide(
            color: AppColors.textLight,
            width: 0.5,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0x0D000000),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // 좌측 빈 공간 (필요시 브레드크럼 등 추가 가능)
          const Spacer(),
          // 우측 메뉴들
          Row(
            children: [
              // 박스 이름
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Row(
                  children: [
                    Icon(
                      Icons.home,
                      size: 16,
                      color: AppColors.textSecondary,
                    ),
                    SizedBox(width: 8),
                    Text(
                      'CrossFit Box',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              // 박스 로고
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.fitness_center,
                  color: Colors.white,
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              // 관리자 설정
              IconButton(
                onPressed: () {
                  _showSettingsMenu(context);
                },
                icon: const Icon(
                  Icons.settings,
                  color: AppColors.textSecondary,
                ),
                tooltip: '관리자 설정',
              ),
              const SizedBox(width: 8),
              // 로그아웃
              IconButton(
                onPressed: () {
                  _showLogoutDialog(context);
                },
                icon: const Icon(
                  Icons.logout,
                  color: AppColors.textSecondary,
                ),
                tooltip: '로그아웃',
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showSettingsMenu(BuildContext context) {
    showMenu(
      context: context,
      position: const RelativeRect.fromLTRB(100, 100, 0, 0),
      items: [
        const PopupMenuItem(
          value: 'profile',
          child: ListTile(
            leading: Icon(Icons.person),
            title: Text('프로필 설정'),
            dense: true,
          ),
        ),
        const PopupMenuItem(
          value: 'box_settings',
          child: ListTile(
            leading: Icon(Icons.business),
            title: Text('박스 설정'),
            dense: true,
          ),
        ),
        const PopupMenuItem(
          value: 'system',
          child: ListTile(
            leading: Icon(Icons.settings),
            title: Text('시스템 설정'),
            dense: true,
          ),
        ),
      ],
    ).then((value) {
      if (value != null) {
        // 메뉴 선택 처리
        switch (value) {
          case 'profile':
            // 프로필 설정 페이지로 이동
            break;
          case 'box_settings':
            // 박스 설정 페이지로 이동
            break;
          case 'system':
            // 시스템 설정 페이지로 이동
            break;
        }
      }
    });
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('로그아웃'),
          content: const Text('정말 로그아웃하시겠습니까?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: const Text('취소'),
            ),
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                // 로그아웃 처리
                // 예: GoRouter.of(context).go('/login');
              },
              child: const Text('로그아웃'),
            ),
          ],
        );
      },
    );
  }
} 