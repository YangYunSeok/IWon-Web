package com.godisweb.controller;

import com.godisweb.dto.NotificationDto;
import com.godisweb.service.KafkaService;
import com.godisweb.service.NotificationService;
import com.godisweb.service.webcom.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/push/")
public class NotificationController {

    private final KafkaTemplate<String, NotificationDto> kafkaTemplate;
    private final NotificationService notificationService;

    /**
     * [2025-10-30]
     * Author : 윤성철
     * 알림 이벤트 생성 컨트롤러(샘플)
     * @return username 알림을 받을 사용자명
     */
    @PostMapping("/produce")
    public String publish(){
        String testname = "joonyoung";

        NotificationDto notificationDto = NotificationDto.builder()
                .id(100L)
                .pushTpCd("03")
                .username(testname)
                .content(testname + "님의 매수 계약이 체결되었습니다.")
                .createdAt(LocalDateTime.now())
                .build()
                ;
        kafkaTemplate.send("user-notifications", testname, notificationDto);

        return testname;
    }

    /**
     * [2025-10-30]
     * Author : 윤성철
     * Push 내역 조회 컨트롤러
     * @return
     */
    @GetMapping("/notifications")
    public Map<String, Object> getNotifications(@RequestParam(defaultValue = "1") int page,
                                                @RequestParam(defaultValue = "10") int size){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String username = userDetails.getUsername();

        return notificationService.getNotifications(username, page, size);
    }
}
