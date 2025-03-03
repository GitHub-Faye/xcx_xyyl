# 小艺医疗API接口文档

## 基础信息

- **API基础URL**: `https://wyw123.pythonanywhere.com/api`
- **认证方式**: JWT Token认证
- **请求头**: 
  ```
  Authorization: Bearer {token}
  Content-Type: application/json
  ```

## API列表

### 1. 健康记录API

#### 1.1 获取健康记录列表

- **URL**: `/health-records/`
- **方法**: `GET`
- **认证**: 需要
- **查询参数**:
  - `start_date`: 开始日期，格式为YYYY-MM-DD
  - `end_date`: 结束日期，格式为YYYY-MM-DD
  - `page`: 页码，默认为1
  - `page_size`: 每页数量，默认为10
  - 筛选参数(可选):
    - `has_blood_pressure`: 是否包含血压记录
    - `has_weight`: 是否包含体重记录
    - `has_blood_sugar`: 是否包含血糖记录
    - `has_temperature`: 是否包含体温记录

- **成功响应**: 
  ```json
  {
    "count": 15,
    "next": "https://wyw123.pythonanywhere.com/api/health-records/?page=2",
    "previous": null,
    "results": [
      {
        "id": "1",
        "weight": 75.5,
        "systolic_pressure": 120,
        "diastolic_pressure": 80,
        "heart_rate": 75,
        "blood_sugar": 5.5,
        "record_time": "2023-12-31T08:30:00Z",
        "created_at": "2023-12-31T08:35:25Z",
        "updated_at": "2023-12-31T08:35:25Z"
      },
      // 更多记录...
    ]
  }
  ```

#### 1.2 获取单条健康记录

- **URL**: `/health-records/{id}/`
- **方法**: `GET`
- **认证**: 需要
- **路径参数**:
  - `id`: 健康记录ID

- **成功响应**: 
  ```json
  {
    "id": "1",
    "weight": 75.5,
    "systolic_pressure": 120,
    "diastolic_pressure": 80,
    "heart_rate": 75,
    "blood_sugar": 5.5,
    "record_time": "2023-12-31T08:30:00Z",
    "created_at": "2023-12-31T08:35:25Z",
    "updated_at": "2023-12-31T08:35:25Z"
  }
  ```

#### 1.3 创建健康记录

- **URL**: `/health-records/`
- **方法**: `POST`
- **认证**: 需要
- **请求体**:
  ```json
  {
    "weight": 75.5,           // 可选，体重(kg)
    "systolic_pressure": 120,  // 可选，收缩压(mmHg)
    "diastolic_pressure": 80,  // 可选，舒张压(mmHg)
    "heart_rate": 75,          // 可选，心率(次/分钟)
    "blood_sugar": 5.5,        // 可选，血糖(mmol/L)
    "temperature": 36.5,       // 可选，体温(℃)
    "record_time": "2023-12-31T08:30:00Z",  // 必填，记录时间
    "notes": "早晨测量"        // 可选，备注
  }
  ```

- **成功响应**: 
  ```json
  {
    "id": "1",
    "weight": 75.5,
    "systolic_pressure": 120,
    "diastolic_pressure": 80,
    "heart_rate": 75,
    "blood_sugar": 5.5,
    "temperature": 36.5,
    "record_time": "2023-12-31T08:30:00Z",
    "notes": "早晨测量",
    "created_at": "2023-12-31T08:35:25Z",
    "updated_at": "2023-12-31T08:35:25Z"
  }
  ```

#### 1.4 更新健康记录

- **URL**: `/health-records/{id}/`
- **方法**: `PATCH`
- **认证**: 需要
- **路径参数**:
  - `id`: 健康记录ID
- **请求体**: (只需包含要更新的字段)
  ```json
  {
    "weight": 76.0,
    "notes": "更新后的测量记录"
  }
  ```

- **成功响应**: 
  ```json
  {
    "id": "1",
    "weight": 76.0,
    "systolic_pressure": 120,
    "diastolic_pressure": 80,
    "heart_rate": 75,
    "blood_sugar": 5.5,
    "temperature": 36.5,
    "record_time": "2023-12-31T08:30:00Z",
    "notes": "更新后的测量记录",
    "created_at": "2023-12-31T08:35:25Z",
    "updated_at": "2023-12-31T08:40:15Z"
  }
  ```

#### 1.5 删除健康记录

- **URL**: `/health-records/{id}/`
- **方法**: `DELETE`
- **认证**: 需要
- **路径参数**:
  - `id`: 健康记录ID

- **成功响应**: 
  - 状态码: 204 No Content

#### 1.6 获取健康统计数据

- **URL**: `/health-records/statistics/`
- **方法**: `GET`
- **认证**: 需要
- **查询参数**:
  - `type`: 记录类型，可选值: weight, bloodPressure, heartRate, bloodSugar
  - `period`: 时间段，可选值: week, month, quarter, all，默认为week

- **成功响应**: 
  ```json
  {
    "weight_avg": 75.5,
    "systolic_pressure_avg": 120,
    "diastolic_pressure_avg": 80,
    "heart_rate_avg": 75,
    "blood_sugar_avg": 5.5,
    "weight_trend": [
      {"date": "2023-12-25", "value": 75.5},
      {"date": "2023-12-26", "value": 75.3}
    ],
    "blood_pressure_trend": [
      {"date": "2023-12-25", "systolic": 120, "diastolic": 80},
      {"date": "2023-12-26", "systolic": 118, "diastolic": 78}
    ],
    "heart_rate_trend": [
      {"date": "2023-12-25", "value": 75},
      {"date": "2023-12-26", "value": 72}
    ],
    "blood_sugar_trend": [
      {"date": "2023-12-25", "value": 5.5},
      {"date": "2023-12-26", "value": 5.3}
    ]
  }
  ```

## 2. 错误处理

所有API可能返回的错误码和错误信息：

| 状态码 | 错误类型 | 说明 |
|--------|----------|------|
| 400 | Bad Request | 请求参数有误或格式不正确 |
| 401 | Unauthorized | 认证失败或未提供认证信息 |
| 403 | Forbidden | 没有权限访问该资源 |
| 404 | Not Found | 请求的资源不存在 |
| 500 | Internal Server Error | 服务器内部错误 |

错误响应格式：
```json
{
  "error": "错误描述信息",
  "detail": "详细错误信息"
}
```

## 3. 分页

列表类API都支持分页，返回格式如下：

```json
{
  "count": 总记录数,
  "next": "下一页URL，如果没有下一页则为null",
  "previous": "上一页URL，如果没有上一页则为null",
  "results": [
    // 当前页的数据记录
  ]
}
``` 