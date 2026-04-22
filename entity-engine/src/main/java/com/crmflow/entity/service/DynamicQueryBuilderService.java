package com.crmflow.entity.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
public class DynamicQueryBuilderService {

    private static final Pattern FIELD_NAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_]+$");

    public record QueryResult(String sql, String countSql, List<Object> params) {}

    public QueryResult build(UUID entityId, UUID tenantId,
                              Map<String, String> filters,
                              String sort, int page, int size) {
        List<Object> params = new ArrayList<>();
        params.add(entityId);
        params.add(tenantId);
        int paramIdx = 3;

        StringBuilder where = new StringBuilder(
                "entity_id = ?1 AND tenant_id = ?2");

        for (Map.Entry<String, String> entry : filters.entrySet()) {
            String fieldExpr = entry.getKey();
            String filterValue = entry.getValue();

            if (!FIELD_NAME_PATTERN.matcher(fieldExpr).matches()) continue;

            String[] opParts = filterValue.split(":", 2);
            if (opParts.length == 1) {
                where.append(" AND data->>'").append(fieldExpr).append("' = ?").append(paramIdx);
                params.add(opParts[0]);
                paramIdx++;
                continue;
            }

            String op = opParts[0];
            String val = opParts[1];

            switch (op) {
                case "eq" -> {
                    where.append(" AND data->>'").append(fieldExpr).append("' = ?").append(paramIdx);
                    params.add(val);
                    paramIdx++;
                }
                case "neq" -> {
                    where.append(" AND data->>'").append(fieldExpr).append("' != ?").append(paramIdx);
                    params.add(val);
                    paramIdx++;
                }
                case "contains" -> {
                    where.append(" AND data->>'").append(fieldExpr).append("' ILIKE ?").append(paramIdx);
                    params.add("%" + val + "%");
                    paramIdx++;
                }
                case "gt" -> {
                    where.append(" AND (data->>'").append(fieldExpr).append("')::numeric > ?").append(paramIdx);
                    params.add(Double.parseDouble(val));
                    paramIdx++;
                }
                case "gte" -> {
                    where.append(" AND (data->>'").append(fieldExpr).append("')::numeric >= ?").append(paramIdx);
                    params.add(Double.parseDouble(val));
                    paramIdx++;
                }
                case "lt" -> {
                    where.append(" AND (data->>'").append(fieldExpr).append("')::numeric < ?").append(paramIdx);
                    params.add(Double.parseDouble(val));
                    paramIdx++;
                }
                case "lte" -> {
                    where.append(" AND (data->>'").append(fieldExpr).append("')::numeric <= ?").append(paramIdx);
                    params.add(Double.parseDouble(val));
                    paramIdx++;
                }
                case "in" -> {
                    String[] values = val.split(",");
                    where.append(" AND data->>'").append(fieldExpr).append("' IN (");
                    for (int i = 0; i < values.length; i++) {
                        if (i > 0) where.append(", ");
                        where.append("?").append(paramIdx);
                        params.add(values[i].trim());
                        paramIdx++;
                    }
                    where.append(")");
                }
                case "null" ->
                        where.append(" AND data->>'").append(fieldExpr).append("' IS NULL");
                case "notnull" ->
                        where.append(" AND data->>'").append(fieldExpr).append("' IS NOT NULL");
                default -> {
                }
            }
        }

        String orderClause = buildOrderClause(sort);
        int offset = page * size;

        String sql = "SELECT * FROM entity_records WHERE " + where
                + orderClause + " LIMIT " + size + " OFFSET " + offset;
        String countSql = "SELECT COUNT(*) FROM entity_records WHERE " + where;

        return new QueryResult(sql, countSql, params);
    }

    private String buildOrderClause(String sort) {
        if (sort == null || sort.isBlank()) {
            return " ORDER BY created_at DESC";
        }
        String[] parts = sort.split(":");
        if (parts.length == 0) return " ORDER BY created_at DESC";

        String field = parts[0];
        if (!FIELD_NAME_PATTERN.matcher(field).matches()) return " ORDER BY created_at DESC";

        String direction = parts.length > 1 && "asc".equalsIgnoreCase(parts[1]) ? "ASC" : "DESC";

        if (field.equals("created_at") || field.equals("updated_at")) {
            return " ORDER BY " + field + " " + direction;
        }
        return " ORDER BY (data->>'" + field + "') " + direction;
    }
}
