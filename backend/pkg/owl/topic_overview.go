package owl

import (
	"context"
	"github.com/twmb/franz-go/pkg/kerr"
	"sort"

	"go.uber.org/zap"
)

// TopicOverview is all information we get when listing Kafka topics
type TopicOverview struct {
	TopicName         string `json:"topicName"`
	IsInternal        bool   `json:"isInternal"`
	PartitionCount    int    `json:"partitionCount"`
	ReplicationFactor int    `json:"replicationFactor"`
	CleanupPolicy     string `json:"cleanupPolicy"`
	LogDirSize        int64  `json:"logDirSize"`

	// What actions the logged in user is allowed to run on this topic
	AllowedActions []string `json:"allowedActions"`
}

// GetTopicsOverview returns a TopicOverview for all Kafka Topics
func (s *Service) GetTopicsOverview(ctx context.Context) ([]*TopicOverview, error) {
	metadata, err := s.kafkaSvc.GetMetadata(ctx, nil)
	if err != nil {
		return nil, err
	}
	topicNames := make([]string, len(metadata.Topics))
	for i, topic := range metadata.Topics {
		err := kerr.ErrorForCode(topic.ErrorCode)
		if err != nil {
			s.logger.Error("failed to get topic metadata while listing topics",
				zap.String("topic_name", topic.Topic),
				zap.Error(err))
			return nil, err
		}

		topicNames[i] = topic.Topic
	}

	// 3. Get log dir sizes for each topic
	logDirsByTopic, err := s.logDirsByTopic(ctx)
	if err != nil {
		return nil, err
	}

	// 3. Create config resources request objects for all topics
	configs, err := s.GetTopicsConfigs(ctx, topicNames, []string{"cleanup.policy"})
	if err != nil {
		s.logger.Warn("failed to fetch topic configs to return cleanup.policy", zap.Error(err))
	}

	// 4. Merge information from all requests and construct the TopicOverview object
	res := make([]*TopicOverview, len(topicNames))
	for i, topic := range metadata.Topics {
		size := int64(-1)
		// TODO: Propagate partial responses/errors to frontend. Size may be wrong/incomplete due to missing responses
		if value, ok := logDirsByTopic.TopicLogDirs[topic.Topic]; ok {
			size = value.TotalSizeBytes
		}

		policy := "N/A"
		if configs != nil {
			// Configs might be nil if we don't have the required Kafka ACLs to get topic configs.
			if val, ok := configs[topic.Topic]; ok {
				entry := val.GetConfigEntryByName("cleanup.policy")
				if entry != nil {
					// This should be safe to dereference as only sensitive values will be nil
					policy = *(entry.Value)
				}
			}
		}

		res[i] = &TopicOverview{
			TopicName:         topic.Topic,
			IsInternal:        topic.IsInternal,
			PartitionCount:    len(topic.Partitions),
			ReplicationFactor: len(topic.Partitions[0].Replicas),
			CleanupPolicy:     policy,
			LogDirSize:        size,
		}
	}

	// 5. Return map as array which is sorted by topic name
	sort.Slice(res, func(i, j int) bool {
		return res[i].TopicName < res[j].TopicName
	})

	return res, nil
}
