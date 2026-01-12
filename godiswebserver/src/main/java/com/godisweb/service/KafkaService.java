package com.godisweb.service;

import com.godisweb.dto.NotificationDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaService {
    private final KafkaTemplate<String, NotificationDto> kafkaTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private String lastMessage = "아직 메세지가 없습니다.";

    public void publishMsg(){
        kafkaTemplate.send("helloWorld", NotificationDto.builder()
                .id(1L)
                .content("WebSocket + kafka 테스트중")
                .build());
    }


    @KafkaListener(topics = "helloWorld", groupId = "testGroup")
    public void listen(NotificationDto notificationDto){
        String msg = notificationDto.getContent();
        log.info("kafka 수신 메세지 : " + msg);
        lastMessage = msg;

        messagingTemplate.convertAndSend("/topic/notification", notificationDto);
    }

    public String getMessage(){
        return lastMessage;
    }
}
