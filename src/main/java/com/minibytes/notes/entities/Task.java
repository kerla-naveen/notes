package com.minibytes.notes.entities;

import com.minibytes.notes.enums.TaskStatus;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Data
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
