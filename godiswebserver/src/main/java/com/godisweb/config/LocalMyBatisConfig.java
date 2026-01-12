package com.godisweb.config;

import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import javax.sql.DataSource;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.util.StringUtils;

@Configuration
@EnableTransactionManagement
public class LocalMyBatisConfig {
    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties localDataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean(name = "localDataSource")
    @Primary
    @ConfigurationProperties("spring.datasource.hikari")
    public DataSource localDataSource(
            @Qualifier("localDataSourceProperties") DataSourceProperties props,
            Environment env) {
        HikariDataSource ds = props.initializeDataSourceBuilder().type(HikariDataSource.class).build();
        if (!StringUtils.hasText(ds.getJdbcUrl())) {
            String url = props.getUrl();
            if (!StringUtils.hasText(url)) {
                url = env.getProperty("spring.datasource.jdbc-url");
            }
            if (StringUtils.hasText(url)) {
                ds.setJdbcUrl(url);
            }
        }
        if (!StringUtils.hasText(ds.getUsername()) && StringUtils.hasText(props.getUsername())) ds.setUsername(props.getUsername());
        if (!StringUtils.hasText(ds.getPassword()) && StringUtils.hasText(props.getPassword())) ds.setPassword(props.getPassword());
        if (!StringUtils.hasText(ds.getDriverClassName()) && StringUtils.hasText(props.getDriverClassName())) ds.setDriverClassName(props.getDriverClassName());
        return ds;
    }

    @Bean(name = "localSqlSessionFactory")
    public SqlSessionFactory localSqlSessionFactory(@Qualifier("localDataSource") DataSource ds) throws Exception {
        SqlSessionFactoryBean bean = new SqlSessionFactoryBean();
        bean.setDataSource(ds);
        
        org.springframework.core.io.Resource[] resources = 
            new PathMatchingResourcePatternResolver().getResources("classpath*:mapper/**/*.xml");
        java.util.List<org.springframework.core.io.Resource> filtered = new java.util.ArrayList<>();
        for (org.springframework.core.io.Resource r : resources) {
            try {
                String p = r.getURL().toString();
                if (p.contains("/mapper/maria120/")) continue; // exclude remote mappers from local
                filtered.add(r);
            } catch (Exception ignore) {}
        }
        bean.setMapperLocations(filtered.toArray(new org.springframework.core.io.Resource[0]));

        return bean.getObject();
    }

    @Bean(name = "localSqlSessionTemplate")
    public SqlSessionTemplate localSqlSessionTemplate(@Qualifier("localSqlSessionFactory") SqlSessionFactory f) {
        return new SqlSessionTemplate(f);
    }

    @Bean(name = "localTxManager")
    public DataSourceTransactionManager localTxManager(@Qualifier("localDataSource") DataSource ds) {
        return new DataSourceTransactionManager(ds);
    }
}
