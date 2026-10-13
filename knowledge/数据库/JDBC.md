# JDBC 知识点整理

## 一、JDBC 概述

- **定义**：Java Database Connectivity，Java连接数据库的标准API
- **作用**：提供统一接口，使Java程序能与不同数据库交互
- **位置**：`java.sql` 和 `javax.sql` 包

***

## 二、核心接口与类

| 接口/类                | 作用            |
| ------------------- | ------------- |
| `DriverManager`     | 管理驱动，建立连接     |
| `Connection`        | 表示数据库连接       |
| `Statement`         | 执行静态SQL语句     |
| `PreparedStatement` | 执行预编译SQL（防注入） |
| `CallableStatement` | 执行存储过程        |
| `ResultSet`         | 查询结果集         |
| `DatabaseMetaData`  | 数据库元数据        |

***

## 三、JDBC 连接步骤（六步）

> **连接 URL 格式**：`jdbc:mysql://主机:端口/数据库名?参数`
> 常用参数：`useSSL=false`、`serverTimezone=Asia/Shanghai`、`characterEncoding=utf8`
> 示例：`jdbc:mysql://localhost:3306/test?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf8`

```java
// 1. 加载驱动（JDBC 4.0后可省略）
Class.forName("com.mysql.cj.jdbc.Driver");

// 2. 获取连接
String url = "jdbc:mysql://localhost:3306/test?useSSL=false&serverTimezone=Asia/Shanghai";
Connection conn = DriverManager.getConnection(url, user, password);

// 3. 创建语句对象
PreparedStatement ps = conn.prepareStatement(sql);

// 4. 执行SQL
ResultSet rs = ps.executeQuery();   // 查询，返回结果集
int rows = ps.executeUpdate();      // 增删改，返回受影响行数
boolean isRs = ps.execute();        // 通用：返回是否有结果集

// 5. 处理结果
while (rs.next()) {
    // rs.getString("column");
}

// 6. 释放资源（倒序关闭）
if (rs != null) rs.close();
if (ps != null) ps.close();
if (conn != null) conn.close();
```

***

## 四、Statement vs PreparedStatement

| 对比项   | Statement | PreparedStatement |
| ----- | --------- | ----------------- |
| SQL编译 | 每次编译      | 预编译，可缓存           |
| SQL注入 | 易受攻击      | 参数化，防注入           |
| 性能    | 较低        | 较高                |
| 适用场景  | 静态SQL     | 动态参数SQL           |

**execute 三兄弟对比**：

| 方法              | 返回值            | 适用场景       |
| --------------- | -------------- | ---------- |
| `executeQuery()`  | `ResultSet`    | 只有 SELECT  |
| `executeUpdate()` | `int` 受影响行数    | INSERT/UPDATE/DELETE/DDL |
| `execute()`      | `boolean` 是否有结果集 | 不确定是查询还是更新  |

***

## 五、事务管理

```java
try {
    conn.setAutoCommit(false);  // 开启事务
    
    // 执行多条SQL...
    
    conn.commit();              // 提交
} catch (Exception e) {
    conn.rollback();            // 回滚
} finally {
    conn.setAutoCommit(true);    // 恢复默认
}
```

**事务特性（ACID）**：

| 特性   | 含义             |
| ---- | -------------- |
| 原子性 A | 事务内操作要么全成功，要么全失败 |
| 一致性 C | 事务前后数据状态保持一致    |
| 隔离性 I | 并发事务之间相互隔离      |
| 持久性 D | 提交后数据永久保存       |

***

## 六、连接池

**常用连接池**：

- HikariCP（Spring Boot默认，性能最佳）
- Druid（阿里巴巴，监控功能强）
- C3P0（老牌）

**核心配置**：

- `maximumPoolSize`：最大连接数
- `minimumIdle`：最小空闲连接
- `connectionTimeout`：连接超时时间
- `idleTimeout`：空闲超时时间

***

## 七、ResultSet 处理

```java
// 游标移动
rs.next();      // 下一行
rs.previous();  // 上一行
rs.absolute(3); // 第3行

// 获取数据
rs.getString("name");
rs.getInt("age");
rs.getObject(1); // 按列索引
```

***

## 八、批处理

```java
conn.setAutoCommit(false);
PreparedStatement ps = conn.prepareStatement(sql);

for (int i = 0; i < list.size(); i++) {
    ps.setString(1, list.get(i).getName());
    ps.addBatch();           // 添加到批
    if ((i + 1) % 1000 == 0) {
        ps.executeBatch();   // 每 1000 条执行一次
        ps.clearBatch();     // 清空批
    }
}
ps.executeBatch();           // 执行剩余不足 1000 条
conn.commit();
```

> **连接 URL 需追加 `rewriteBatchedStatements=true`**，批量插入才会真正合并成一次网络传输，否则仍逐条执行、性能提升有限。

***

## 九、常见异常

| 异常                                         | 原因             |
| ------------------------------------------ | -------------- |
| `ClassNotFoundException`                   | 驱动类未找到（依赖缺失）  |
| `SQLException`                             | SQL 执行错误（父类）    |
| `SQLIntegrityConstraintViolationException` | 违反约束（如主键/唯一重复） |
| `SQLSyntaxErrorException`                  | SQL 语法错误         |
| `SQLTimeoutException`                      | 查询超时            |
| `CommunicationsException`                  | 连接中断/数据库未启动     |

***