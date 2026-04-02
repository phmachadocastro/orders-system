package com.orders;

import io.agroal.api.AgroalDataSource;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.sql.Connection;
import java.sql.PreparedStatement;

@ApplicationScoped
public class OrderStatusWorker {
    private static final Logger LOG = Logger.getLogger(OrderStatusWorker.class);

    @Inject
    AgroalDataSource dataSource;

    @ConfigProperty(name = "worker.confirm-after-minutes")
    int confirmAfterMinutes;

    @Scheduled(every = "{worker.confirm-interval}")
    void confirmPendingOrders() {
        if (confirmAfterMinutes <= 0) {
            LOG.errorf("Invalid worker.confirm-after-minutes value: %d", confirmAfterMinutes);
            return;
        }

        String sql = """
            UPDATE orders
            SET status = 'confirmed'
            WHERE status = 'pending'
              AND created_at < (NOW() AT TIME ZONE 'UTC') - make_interval(mins => ?)
            """;

        try (Connection conn = dataSource.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, confirmAfterMinutes);
            int updated = ps.executeUpdate();
            LOG.infov("Worker confirmed {0} pending orders", updated);
        } catch (Exception e) {
            LOG.error("Worker failed to confirm pending orders", e);
        }
    }
}
