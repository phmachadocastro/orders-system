package com.orders;

import io.agroal.api.AgroalDataSource;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.sql.Connection;
import java.sql.PreparedStatement;

@ApplicationScoped
public class OrderStatusWorker {
    private static final Logger LOG = Logger.getLogger(OrderStatusWorker.class);

    @Inject
    AgroalDataSource dataSource;

    @Scheduled(every = "60s")
    void confirmPendingOrders() {
        String sql = """
            UPDATE orders
            SET status = 'confirmed'
            WHERE status = 'pending'
              AND created_at < (NOW() AT TIME ZONE 'UTC') - INTERVAL '10 minutes'
            """;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            int updated = ps.executeUpdate();
            LOG.infov("Worker confirmed {0} pending orders", updated);
        } catch (Exception e) {
            LOG.error("Worker failed to confirm pending orders", e);
        }
    }
}
