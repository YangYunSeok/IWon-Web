package com.godisweb.listener;

import com.godisweb.dto.NotificationDto;
import com.godisweb.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationKafkaListener {

    private final NotificationService notificationService;

    /**
    * [2025-10-28]
            * Author : 윤성철
     * Kafka 메세지 consume
     *  1. 알림 내용 DB 저장
     *  2. 클라이언트로 알림 전송
     * @param notificationDto
     */
    @KafkaListener(topics = "user-notifications")
    public void onMessage(NotificationDto notificationDto){
        log.info("Kafka 수신 : {}", notificationDto);

        //1. DB 알림 저장 트랜잭션
        notificationService.saveNotification(notificationDto);

        //2. 트랜잭션 종료 이후 WebSocket 전송
        notificationService.sendSocket(notificationDto);
    }
}
