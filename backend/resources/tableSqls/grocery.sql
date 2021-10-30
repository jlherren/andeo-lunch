CREATE TABLE `grocery` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `label` varchar(255) NOT NULL,
  `checked` tinyint(1) NOT NULL DEFAULT 0,
  `order` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `checked_order_idx` (`checked`,`order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
