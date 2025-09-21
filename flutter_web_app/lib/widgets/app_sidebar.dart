import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class AppSidebar extends StatelessWidget {
  final int selectedIndex;
  final Function(int) onItemSelected;

  const AppSidebar({
    super.key,
    required this.selectedIndex,
    required this.onItemSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 280,
      height: MediaQuery.of(context).size.height,
      decoration: const BoxDecoration(
        color: AppColors.sidebarBackground,
      ),
      child: Column(
        children: [
          // 로고 영역
          Container(
            height: 80,
            padding: const EdgeInsets.all(16),
            child: const Row(
              children: [
                Icon(
                  Icons.fitness_center,
                  color: Colors.white,
                  size: 32,
                ),
                SizedBox(width: 12),
                Text(
                  'Sweat Bridge Box',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const Divider(color: AppColors.textSecondary, height: 1),
          // 메뉴 항목들
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: [
                _buildMenuItem(
                  icon: Icons.dashboard,
                  title: '대시보드',
                  index: 0,
                  isSelected: selectedIndex == 0,
                ),
                _buildMenuItem(
                  icon: Icons.fitness_center,
                  title: '와드 관리',
                  index: 1,
                  isSelected: selectedIndex == 1,
                ),
                _buildMenuItem(
                  icon: Icons.people,
                  title: '회원 관리',
                  index: 2,
                  isSelected: selectedIndex == 2,
                ),
                _buildMenuItem(
                  icon: Icons.schedule,
                  title: '수업 관리',
                  index: 3,
                  isSelected: selectedIndex == 3,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required int index,
    required bool isSelected,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.sidebarActive : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
      ),
      child: ListTile(
        leading: Icon(
          icon,
          color: isSelected ? Colors.white : AppColors.sidebarText,
          size: 20,
        ),
        title: Text(
          title,
          style: TextStyle(
            color: isSelected ? Colors.white : AppColors.sidebarText,
            fontSize: 14,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
        onTap: () => onItemSelected(index),
        dense: true,
        visualDensity: VisualDensity.compact,
      ),
    );
  }
} 