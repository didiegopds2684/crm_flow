package com.crmflow.entity.mapper;

import com.crmflow.entity.dto.EntityRecordResponse;
import com.crmflow.entity.model.EntityRecord;
import org.springframework.stereotype.Component;

@Component
public class EntityRecordMapper {

    public EntityRecordResponse toResponse(EntityRecord record) {
        return new EntityRecordResponse(
                record.getId(),
                record.getEntityId(),
                record.getTenantId(),
                record.getData(),
                record.getCreatedBy(),
                record.getCreatedAt(),
                record.getUpdatedAt()
        );
    }
}
