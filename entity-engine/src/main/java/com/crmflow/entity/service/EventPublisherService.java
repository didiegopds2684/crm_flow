package com.crmflow.entity.service;

import com.crmflow.entity.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventPublisherService {

    private final RabbitTemplate rabbitTemplate;

    public record EntityEvent(
            UUID tenantId,
            String entitySlug,
            UUID recordId,
            String action,
            Map<String, Object> payload,
            UUID actorId,
            Instant occurredAt
    ) {}

    public void publishCreated(UUID tenantId, String slug, UUID recordId,
                                Map<String, Object> data, UUID actorId) {
        publish(tenantId, slug, recordId, "CREATED", data, actorId, RabbitMQConfig.ROUTING_KEY_CREATED);
    }

    public void publishUpdated(UUID tenantId, String slug, UUID recordId,
                                Map<String, Object> data, UUID actorId) {
        publish(tenantId, slug, recordId, "UPDATED", data, actorId, RabbitMQConfig.ROUTING_KEY_UPDATED);
    }

    public void publishDeleted(UUID tenantId, String slug, UUID recordId, UUID actorId) {
        publish(tenantId, slug, recordId, "DELETED", Map.of(), actorId, RabbitMQConfig.ROUTING_KEY_DELETED);
    }

    private void publish(UUID tenantId, String slug, UUID recordId, String action,
                          Map<String, Object> data, UUID actorId, String routingKey) {
        try {
            EntityEvent event = new EntityEvent(tenantId, slug, recordId, action,
                    data, actorId, Instant.now());
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE, routingKey, event);
            log.debug("Evento {} publicado: entity={} record={}", action, slug, recordId);
        } catch (Exception e) {
            log.error("Falha ao publicar evento {} para entity={}: {}", action, slug, e.getMessage());
        }
    }
}
