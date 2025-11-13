package com.investtracker.notification;

import com.investtracker.alert.entity.PriceAlert;
import com.investtracker.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {
    private final JavaMailSender mailSender;
    
    @Value("${spring.mail.from:noreply@investtracker.com}")
    private String fromEmail;
    
    public void sendPriceAlertEmail(User user, PriceAlert alert, String currentPrice) {
        if (user.getEmail() == null || user.getEmail().isEmpty()) {
            log.warn("User {} has no email address, skipping email notification", user.getUsername());
            return;
        }
        
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(user.getEmail());
            message.setSubject(String.format("Price Alert: %s %s $%s", 
                alert.getAssetSymbol(), 
                alert.getConditionType() == PriceAlert.ConditionType.BELOW ? "dropped below" : "rose above",
                alert.getTargetPrice()));
            
            message.setText(String.format(
                "Hello %s,\n\n" +
                "Your price alert for %s has been triggered!\n\n" +
                "Asset: %s (%s)\n" +
                "Target Price: $%s\n" +
                "Current Price: $%s\n" +
                "Condition: %s\n\n" +
                "You can view your alerts at: http://localhost:3000/alerts\n\n" +
                "Best regards,\n" +
                "Investment Tracker Team",
                user.getUsername(),
                alert.getAssetSymbol(),
                alert.getAssetSymbol(),
                alert.getAssetName(),
                alert.getTargetPrice(),
                currentPrice,
                alert.getConditionType()
            ));
            
            mailSender.send(message);
            log.info("Price alert email sent to {} for alert {}", user.getEmail(), alert.getId());
        } catch (Exception e) {
            log.error("Error sending price alert email to {}: {}", user.getEmail(), e.getMessage());
        }
    }
}

