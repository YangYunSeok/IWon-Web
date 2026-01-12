package com.godisweb.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * [2025-10-30]
 * Author : 윤성철
 * 메시지큐 DTO
 */
@Getter
@NoArgsConstructor()
public class NotificationDto {

    private Long id;
    private String pushTpCd;
    private String username;
    private String content;
    private LocalDateTime createdAt;

    @Builder
    public NotificationDto(Long id, String pushTpCd, String username, String content, LocalDateTime createdAt) {
        this.id = id;
        this.pushTpCd = pushTpCd;
        this.username = username;
        this.content = content;
        this.createdAt = createdAt;
    }
}
