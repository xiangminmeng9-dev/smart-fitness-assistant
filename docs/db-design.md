# 数据库设计文档

## 概述

基于 spec.md 要求的数据库表设计。

## 表结构

### users 用户表
存储用户登录信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT AUTO_INCREMENT | 主键 |
| username | VARCHAR(50) | 用户名，唯一 |
| password_hash | VARCHAR(255) | 密码哈希值 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**索引:**
- PRIMARY KEY (id)
- UNIQUE KEY (username)

### user_profiles 用户资料表
存储用户身体数据和健身目标。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT AUTO_INCREMENT | 主键 |
| user_id | INT | 外键，关联 users.id |
| age | INT | 年龄 |
| height | DECIMAL(5,2) | 身高（厘米） |
| weight | DECIMAL(5,2) | 体重（公斤） |
| fitness_goal | ENUM('减脂', '增肌') | 健身目标 |
| fitness_frequency | INT | 每周健身频次 |
| location_lat | DECIMAL(10,8) | 纬度（地理位置） |
| location_lng | DECIMAL(11,8) | 经度（地理位置） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**索引:**
- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id)
- INDEX (user_id)

### fitness_plans 健身计划表
存储AI生成的每日健身计划。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT AUTO_INCREMENT | 主键 |
| user_id | INT | 外键，关联 users.id |
| plan_date | DATE | 计划日期 |
| plan_data | JSON | AI生成的计划（结构化数据） |
| completed | BOOLEAN | 是否完成 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**索引:**
- PRIMARY KEY (id)
- FOREIGN KEY (user_id) REFERENCES users(id)
- UNIQUE KEY (user_id, plan_date) - 每个用户每天只有一个计划
- INDEX (user_id)
- INDEX (plan_date)

## 关系图

```
users (1) ─── (1) user_profiles
   │
   └── (1:n) fitness_plans
```

## 数据示例

### users
```sql
INSERT INTO users (username, password_hash) VALUES
('test', '$2b$12$...');
```

### user_profiles
```sql
INSERT INTO user_profiles (user_id, age, height, weight, fitness_goal, fitness_frequency) VALUES
(1, 30, 175.00, 70.00, '减脂', 3);
```

### fitness_plans
```sql
INSERT INTO fitness_plans (user_id, plan_date, plan_data) VALUES
(1, '2024-03-29', '{"workout": [...], "diet": [...], "motivation": "..."}');
```