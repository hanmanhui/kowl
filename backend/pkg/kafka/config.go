package kafka

import (
	"flag"
	"fmt"
	"github.com/cloudhut/kowl/backend/pkg/proto"
	"github.com/cloudhut/kowl/backend/pkg/schema"
)

// Config required for opening a connection to Kafka
type Config struct {
	// General
	Brokers        []string `yaml:"brokers"`
	ClientID       string   `yaml:"clientId"`
	ClusterVersion string   `yaml:"clusterVersion"`
	RackID         string   `yaml:"rackId"`

	// Schema Registry
	Schema   schema.Config `yaml:"schemaRegistry"`
	Protobuf proto.Config  `yaml:"protobuf"`

	TLS  TLSConfig  `yaml:"tls"`
	SASL SASLConfig `yaml:"sasl"`
}

// RegisterFlags registers all nested config flags.
func (c *Config) RegisterFlags(f *flag.FlagSet) {
	c.TLS.RegisterFlags(f)
	c.SASL.RegisterFlags(f)
	c.Protobuf.RegisterFlags(f)
	c.Schema.RegisterFlags(f)
}

// Validate the Kafka config
func (c *Config) Validate() error {
	if len(c.Brokers) == 0 {
		return fmt.Errorf("you must specify at least one broker to connect to")
	}

	err := c.Schema.Validate()
	if err != nil {
		return err
	}

	err = c.Protobuf.Validate()
	if err != nil {
		return fmt.Errorf("failed to validate protobuf config: %w", err)
	}

	return nil
}

// SetDefaults for Kafka config
func (c *Config) SetDefaults() {
	c.ClientID = "kowl"
	c.ClusterVersion = "1.0.0"

	c.SASL.SetDefaults()
	c.Protobuf.SetDefaults()
}
