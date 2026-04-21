package com.minibytes.notes.entities;

import com.minibytes.notes.enums.TaskStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Task {
    
    @Id
    @GeneratedValue
    private Long id;
    
    private String title;
    
    private String description;
    
    @Enumerated(EnumType.STRING)
    private TaskStatus status;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
