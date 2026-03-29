# API 文档

## 概述

智能健身助手后端API接口文档。

## 认证

所有API（除登录/注册外）需要JWT token认证，在请求头中携带：
```
Authorization: Bearer <token>
```

## 接口列表

### 用户认证

#### POST /api/auth/register
用户注册

**请求体:**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应:**
```json
{
  "id": "number",
  "username": "string",
  "token": "string"
}
```

#### POST /api/auth/login
用户登录

**请求体:**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应:**
```json
{
  "id": "number",
  "username": "string",
  "token": "string"
}
```

### 用户资料

#### GET /api/user/profile
获取当前用户资料

#### POST /api/user/profile
创建或更新用户资料

#### GET /api/user/plan?date=YYYY-MM-DD
获取指定日期的健身计划

#### POST /api/user/plan/generate
生成新的健身计划

### 系统

#### GET /api/weather
获取天气信息

#### GET /api/motivation
获取鼓励语

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |