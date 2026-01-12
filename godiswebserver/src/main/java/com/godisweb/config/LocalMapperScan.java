package com.godisweb.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@MapperScan(
    basePackages = {"com.godisweb.mapper", "com.godisweb.local.mapper"},
    sqlSessionTemplateRef = "localSqlSessionTemplate"
)
public class LocalMapperScan {
}
