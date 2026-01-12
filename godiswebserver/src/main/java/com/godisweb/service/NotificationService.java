package com.godisweb.service;

import com.godisweb.dto.NotificationDto;
import com.godisweb.mapper.PushMsgMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final PushMsgMapper pushMsgMapper;

    /**
     * [2025-11-07]
     * Author : 윤성철
     * Push 알림 Socket 전송 기능
     * @param notificationDto
     */
    public void sendSocket(NotificationDto notificationDto){
        try {
            messagingTemplate.convertAndSendToUser(
                    notificationDto.getUsername(),
                    "/queue/notification",
                    notificationDto
            );
            log.info("WebSocket 발송 완료 : {}", notificationDto.getUsername());
        }  catch (Exception e){
            log.error("WebSocket 전송 실패 - user={}, error={}", notificationDto.getUsername(), e.getMessage());
        }

    }

    /**
     * [2025-10-28]
     * Author : 윤성철
     * PUSH 알림 내역 조회 기능
     * @param username
     * @return
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getNotifications(String username, int page, int size){
        log.info("Push 내역 조회 시작 : {}", username);

        int totalPushCount = pushMsgMapper.countPushList(username);
        int offset = (page -1) * size;
        if(totalPushCount == 0){
            return Map.of("status", false, "totalPushCount", totalPushCount, "page", page);
        }

        List<Map<String, Object>> notifications = pushMsgMapper.selectPushMsgs(username, offset, size);

        Map<String, Object> result = new HashMap<>();
        result.put("totalPushCount", totalPushCount);
        result.put("page", page);
        result.put("size", size);
        result.put("notifications", notifications);

        return result;
    }

    /**
     * [2025-11-03]
     * Author : 윤성철
     * Push 알림 저장 기능
     * @param notificationDto
     */
    @Transactional
    public void saveNotification(NotificationDto notificationDto){
        Map<String, Object> notification = new HashMap<>();
        notification.put("PUSH_TP_CD", notificationDto.getPushTpCd());
        notification.put("PUSH_ID", notificationDto.getId());
        notification.put("USER_ID", notificationDto.getUsername());
        notification.put("PUSH_MSG_CONTN", notificationDto.getContent());

        pushMsgMapper.insertPushMsg(notification);
        log.info("DB 저장 완료 : {}", notificationDto.getContent());
    }
}
